import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { isMeaningfulText, sanitizePlainText } from "@/lib/text-utils";
import { fetchJobPostingFromUrl } from "@/lib/job-posting-server";
import { deriveJobMetadata } from "@/lib/job-posting";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseMarkdownToResumeData } from "@/lib/resume-parser-structured";
import { defaultResumeVariant } from "@/lib/resume-templates/variants";
import type { ResumeData } from "@/lib/resume-templates/types";

const MAX_SAVED = 3;
const LIMIT_ERROR_MESSAGE = "You can keep up to 3 adapted resumes. Please delete one from the Resume Editor.";

export async function POST(req: NextRequest) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
        }

        const supabase = await getSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check limit first to save resources
        const { count, error: countError } = await supabase
            .from("rewritten_resumes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);

        if (countError) {
            return NextResponse.json({ error: "Failed to check saved resumes limit" }, { status: 500 });
        }

        if ((count ?? 0) >= MAX_SAVED) {
            return NextResponse.json({ error: LIMIT_ERROR_MESSAGE }, { status: 400 });
        }

        const body = await req.json();
        const { resumeText, resumeId, jobDescription, jobLink } = body;

        // 1. Validation
        if ((!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) && !resumeId) {
            return NextResponse.json({ error: "Resume text or resumeId is required" }, { status: 400 });
        }
        if ((!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length === 0) && !jobLink) {
            return NextResponse.json({ error: "Job description or link is required" }, { status: 400 });
        }

        let cleanedResume = "";
        if (resumeId) {
            try {
                const { data: resumeRecord, error: resumeError } = await supabase
                    .from("resumes")
                    .select("extracted_text, user_id")
                    .eq("id", resumeId)
                    .single();

                if (resumeError || !resumeRecord) {
                    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
                }

                if (resumeRecord.user_id !== user.id) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                }

                cleanedResume = sanitizePlainText(resumeRecord.extracted_text || "");
            } catch (error) {
                console.error("Failed to load resume by id:", error);
                return NextResponse.json({ error: "Failed to load resume" }, { status: 500 });
            }
        } else {
            cleanedResume = sanitizePlainText(resumeText);
        }

        let cleanedJobDescription = sanitizePlainText(jobDescription || "");
        if (!cleanedJobDescription && jobLink) {
            try {
                const fetched = await fetchJobPostingFromUrl(jobLink);
                cleanedJobDescription = sanitizePlainText(fetched);
            } catch (error) {
                console.error("Failed to fetch job posting for adapt-resume:", error);
                return NextResponse.json(
                    { error: "Failed to fetch job posting from the provided link. Please try pasting the description." },
                    { status: 400 }
                );
            }
        }

        const inputLooksValid = isMeaningfulText(cleanedResume) && isMeaningfulText(cleanedJobDescription);
        if (!inputLooksValid) {
            return NextResponse.json(
                {
                    error: "The provided text is not a valid resume or job description. Please upload your resume and vacancy details.",
                },
                { status: 400 }
            );
        }

        // Simple length checks to prevent abuse/token limits
        if (cleanedResume.length > 50000) {
            return NextResponse.json({ error: "Resume text is too long" }, { status: 400 });
        }
        if (cleanedJobDescription.length > 50000) {
            return NextResponse.json({ error: "Job description is too long" }, { status: 400 });
        }

        // Derive job metadata for storage
        const jobMetadata = deriveJobMetadata(cleanedJobDescription, jobLink || "");
        const derivedJobTitle = jobMetadata.title || "Job Opportunity";
        const derivedJobCompany = jobMetadata.company || null;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // 2. Initialize Gemini
        const ai = new GoogleGenAI({ apiKey });

        // 3. Construct Prompt
        const prompt = `
You are ImpreCV — an expert AI resume writer and ATS optimizer.

TASK:
Adapt the candidate's resume to the provided job description. Your goal is to MAXIMIZE the match between the resume and the job requirements while remaining TRUTHFUL.

INPUT RESUME:
${cleanedResume}

JOB DESCRIPTION:
${cleanedJobDescription}

CRITICAL INSTRUCTIONS:
1. **Preserve & Supplement**:
   - **Retain Core Content**: Do NOT remove the candidate's existing skills, tools, or experience. Keep the foundation intact.
   - **Add Missing Skills**: If the Job Description requires skills/tools not present in the resume, **ADD THEM** to the Skills section or weave them into the Summary/Experience.
   - **Handle Extra Sections**: If the candidate has sections like "Projects", "Volunteering", or "Languages", PRESERVE them. Use the "custom" type for these.
2. **Refine & Embellish**:
   - **Improve Formulations**: Rewrite existing bullet points to use the *exact terminology* and keywords from the Job Description.
   - **Bridge Gaps**: If a specific experience is required but missing, "smooth" the formulation to include it naturally.
3. **Professional Summary**: Rewrite it to immediately highlight the match between the candidate's background and the job.
4. **Missing Information**: If specific personal info (like phone or LinkedIn) is missing from the input, return an empty string "" or null. Do NOT make up fake contact info.

OUTPUT FORMAT - ABSOLUTE REQUIREMENTS:

⚠️ CRITICAL: Your response MUST be a valid JSON object.
- Your response MUST start with '{' and end with '}'
- Do NOT include ANY text before or after the JSON object
- Do NOT wrap in markdown code blocks (no \`\`\`json)
- Do NOT include comments or explanations
- Return ONLY the raw JSON string

SECTION CONTENT RULES:
1. **Simple Text Sections** (summary, skills, languages): Use a PLAIN STRING
   - "content": "Text content here..."
   - If empty: "content": ""
   
2. **Structured List Sections** (experience, education, projects, certifications): Use ARRAY OF OBJECTS
   - Each object MUST have: "title", optionally "subtitle", "date", "description", "bullets"
   - "content": [{ "title": "...", "subtitle": "...", "date": "...", "bullets": ["..."] }]
   - If section exists but has no items: "content": []
   - ⚠️ NEVER use empty string "" for array sections
   - ⚠️ NEVER use plain string arrays like ["item1", "item2"]

MINIMAL VALID JSON TEMPLATE - Always follow this exact structure:

{
  "personalInfo": {
    "name": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "website": ""
  },
  "sections": [
    {
      "type": "summary",
      "title": "Professional Summary",
      "content": ""
    },
    {
      "type": "experience",
      "title": "Work Experience",
      "content": []
    },
    {
      "type": "education",
      "title": "Education",
      "content": []
    },
    {
      "type": "skills",
      "title": "Skills",
      "content": ""
    }
  ]
}

DETAILED EXAMPLES:

Summary section (string):
{
  "type": "summary",
  "title": "Professional Summary",
  "content": "Highly analytical and detail-oriented professional with 5+ years of experience..."
}

Experience section (array of objects):
{
  "type": "experience",
  "title": "Work Experience",
  "content": [
    {
      "title": "Software Developer",
      "subtitle": "Tech Solutions Inc., City, State",
      "date": "January 2020 - Present",
      "description": null,
      "bullets": [
        "Developed web applications using React and Node.js",
        "Improved system performance by 40%"
      ]
    }
  ]
}

Education section (array of objects):
{
  "type": "education",
  "title": "Education",
  "content": [
    {
      "title": "Bachelor of Science in Computer Science",
      "subtitle": "XYZ University, City, State",
      "date": "Graduated: May 2019"
    }
  ]
}

Skills section (string):
{
  "type": "skills",
  "title": "Skills",
  "content": "SQL, Python, JavaScript, React, Node.js, Docker, AWS, Git, Agile"
}

Projects section (array of objects):
{
  "type": "custom",
  "title": "Projects",
  "content": [
    {
      "title": "Online Shopping Platform",
      "description": "Developed a full-stack e-commerce platform using React, Node.js, and MongoDB",
      "bullets": [
        "Implemented user authentication and payment integration",
        "Deployed using AWS services"
      ]
    }
  ]
}

Certifications section (array of objects):
{
  "type": "custom",
  "title": "Certifications",
  "content": [
    {
      "title": "AWS Certified Developer – Associate",
      "subtitle": "Amazon Web Services",
      "date": "2023"
    }
  ]
}

Languages section (string):
{
  "type": "custom",
  "title": "Languages",
  "content": "English (Fluent), Spanish (Conversational)"
}

FINAL REMINDERS:
✅ Response MUST start with '{' and end with '}'
✅ For array sections: use [] if empty, NEVER ""
✅ For string sections: use "" if empty, NEVER []
✅ Projects/Certifications = array of objects
✅ Skills/Languages = string
✅ No markdown, no comments, no explanations

`;


        // 4. Call Gemini API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 8192,
                temperature: 0.4,
                responseMimeType: "application/json"
            },
        });

        // 5. Extract Text
        let rawResponseText = "";

        try {
            if (typeof (response as any).text === 'function') {
                rawResponseText = (response as any).text();
            } else if (typeof (response as any).text === 'string') {
                rawResponseText = (response as any).text;
            } else if (response.candidates && response.candidates.length > 0) {
                rawResponseText = response.candidates[0].content?.parts?.[0]?.text || "";
            }
        } catch (e) {
            console.error("Error extracting text from Gemini response:", e);
        }

        // 6. Return JSON directly (frontend will handle parsing)
        let adaptedResume = rawResponseText;
        try {
            JSON.parse(rawResponseText);
        } catch (e) {
            console.error("AI did not return valid JSON:", rawResponseText);
        }

        const parsedData: ResumeData = parseMarkdownToResumeData(adaptedResume);
        const serializedContent = JSON.stringify(parsedData);

        const { data: existing } = await supabase
            .from("rewritten_resumes")
            .select("id, content, structured_data, resume_id, variant, theme, pdf_url, pdf_path, created_at, updated_at, file_name, job_title, job_company")
            .eq("user_id", user.id)
            .eq("content", serializedContent)
            .limit(1)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ item: existing, resumeData: parsedData });
        }



        const { data: saved, error: insertError } = await supabase
            .from("rewritten_resumes")
            .insert({
                user_id: user.id,
                resume_id: resumeId || null,
                content: serializedContent,
                structured_data: parsedData,
                format: "json",
                variant: defaultResumeVariant,
                theme: "light",
                file_name: parsedData.personalInfo.name || "resume",
                job_description: cleanedJobDescription,
                job_link: jobLink || null,
                job_title: derivedJobTitle,
                job_company: derivedJobCompany,
            })
            .select("id, content, structured_data, resume_id, variant, theme, pdf_url, pdf_path, created_at, updated_at, file_name, job_title, job_company")
            .single();

        if (insertError || !saved) {
            console.error("Failed to save adapted resume:", insertError);
            return NextResponse.json({ error: "Failed to save adapted resume" }, { status: 500 });
        }

        return NextResponse.json({ item: saved, resumeData: parsedData });
    } catch (error: any) {
        console.error("Error in adapt-resume:", error);
        return NextResponse.json(
            { error: error.message || "Failed to adapt resume" },
            { status: 500 }
        );
    }
}
