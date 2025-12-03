import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { isMeaningfulText, sanitizePlainText } from "@/lib/text-utils";
import { fetchJobPostingFromUrl } from "@/lib/job-posting-server";
import { deriveJobMetadata } from "@/lib/job-posting";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseMarkdownToResumeData } from "@/lib/resume-parser-structured";
import { defaultResumeVariant } from "@/lib/resume-templates/variants";
import { createLLMClient, LLMError, LLM_MODELS, cleanJsonResponse } from "@/lib/api/llm";
import { createLogger } from "@/lib/api/logger";
import type { ResumeData } from "@/lib/resume-templates/types";

const MAX_SAVED = 3;
const LIMIT_ERROR_MESSAGE = "You can keep up to 3 adapted resumes. Please delete one from the Resume Editor.";
const RATE_LIMIT_MINUTES = 5;
const RATE_LIMIT_ERROR_MESSAGE = "Please wait a few minutes before re-adapting this resume.";

export async function POST(req: NextRequest) {
    const logger = createLogger("adapt-resume");
    
    try {
        if (!isSupabaseConfigured()) {
            logger.error("supabase_not_configured");
            return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
        }

        const supabase = await getSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            logger.warn("unauthorized_request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userLogger = createLogger("adapt-resume", user.id);
        userLogger.requestStart("/api/adapt-resume");

        const body = await req.json();
        const { resumeText, resumeId, jobDescription, jobLink } = body;

        // 1. Validation
        if ((!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) && !resumeId) {
            userLogger.warn("validation_failed", { reason: "missing_resume" });
            return NextResponse.json({ error: "Resume text or resumeId is required" }, { status: 400 });
        }
        if ((!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length === 0) && !jobLink) {
            userLogger.warn("validation_failed", { reason: "missing_job" });
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

        // Initialize LLM client with automatic fallback support
        let llmClient
        try {
            llmClient = createLLMClient("[Adapt]")
        } catch (error) {
            if (error instanceof LLMError && error.type === "API_KEY_MISSING") {
                userLogger.error("api_key_missing")
                return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
            }
            throw error
        }

        // Call LLM with automatic fallback (gemini-2.5-flash → gemini-2.0-flash)
        let rawResponseText = ""
        let modelUsed = LLM_MODELS.PRIMARY
        try {
            const response = await llmClient.generate(prompt, {
                model: LLM_MODELS.PRIMARY,
                configType: "adaptation",
                enableFallback: true,
                logPrefix: "[Adapt]"
            })
            rawResponseText = response.text
            modelUsed = response.model
            
            userLogger.llmComplete({
                model: modelUsed,
                usedFallback: response.usedFallback,
                success: true
            })
        } catch (error) {
            userLogger.llmComplete({
                model: modelUsed,
                usedFallback: false,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            })
            
            if (error instanceof LLMError) {
                if (error.type === "RATE_LIMIT") {
                    userLogger.requestComplete(429, { reason: "rate_limit" })
                    return NextResponse.json({ 
                        error: "AI service is temporarily overloaded. Please try again in a few moments." 
                    }, { status: 429 })
                }
            }
            userLogger.requestComplete(500, { reason: "llm_failed" })
            return NextResponse.json({ error: "Failed to adapt resume" }, { status: 500 })
        }

        // Parse and validate JSON response
        let adaptedResume = cleanJsonResponse(rawResponseText);
        try {
            JSON.parse(adaptedResume);
        } catch (e) {
            userLogger.warn("json_parse_failed", { responseLength: adaptedResume?.length })
        }

        const parsedData: ResumeData = parseMarkdownToResumeData(adaptedResume);
        const serializedContent = JSON.stringify(parsedData);

        const { data: existing } = await supabase
            .from("rewritten_resumes")
            .select(`
                id, content, structured_data, resume_id, variant, theme, 
                pdf_url, pdf_path, created_at, updated_at, file_name, job_posting_id,
                job_posting:job_postings(id, title, company, description, link)
            `)
            .eq("user_id", user.id)
            .eq("content", serializedContent)
            .limit(1)
            .maybeSingle();

        if (existing) {
            // Flatten job_posting data for backward compatibility
            const jobPosting = existing.job_posting as { title?: string; company?: string } | null;
            const item = {
                ...existing,
                job_title: jobPosting?.title || null,
                job_company: jobPosting?.company || null,
            };
            return NextResponse.json({ item, resumeData: parsedData });
        }

        // Find or create job posting (deduplicate by link or description hash)
        let jobPostingId: string;
        const descriptionHash = createHash("md5").update(cleanedJobDescription).digest("hex");

        if (jobLink) {
            // Try to find existing job posting by link
            const { data: existingJobPosting } = await supabase
                .from("job_postings")
                .select("id")
                .eq("user_id", user.id)
                .eq("link", jobLink)
                .maybeSingle();

            if (existingJobPosting) {
                jobPostingId = existingJobPosting.id;
            } else {
                const { data: newJobPosting, error: jobPostingError } = await supabase
                    .from("job_postings")
                    .insert({
                        user_id: user.id,
                        title: derivedJobTitle,
                        company: derivedJobCompany,
                        description: cleanedJobDescription,
                        description_hash: descriptionHash,
                        link: jobLink,
                    })
                    .select("id")
                    .single();

                if (jobPostingError || !newJobPosting) {
                    console.error("Failed to save job posting:", jobPostingError);
                    return NextResponse.json({ error: "Failed to save job posting" }, { status: 500 });
                }
                jobPostingId = newJobPosting.id;
            }
        } else {
            // No link - deduplicate by description hash
            const { data: existingJobPosting } = await supabase
                .from("job_postings")
                .select("id")
                .eq("user_id", user.id)
                .eq("description_hash", descriptionHash)
                .is("link", null)
                .maybeSingle();

            if (existingJobPosting) {
                jobPostingId = existingJobPosting.id;
            } else {
                const { data: newJobPosting, error: jobPostingError } = await supabase
                    .from("job_postings")
                    .insert({
                        user_id: user.id,
                        title: derivedJobTitle,
                        company: derivedJobCompany,
                        description: cleanedJobDescription,
                        description_hash: descriptionHash,
                        link: null,
                    })
                    .select("id")
                    .single();

                if (jobPostingError || !newJobPosting) {
                    console.error("Failed to save job posting:", jobPostingError);
                    return NextResponse.json({ error: "Failed to save job posting" }, { status: 500 });
                }
                jobPostingId = newJobPosting.id;
            }
        }

        // Check if this resume+job_posting combo already exists (for upsert logic)
        let existingAdaptedResume = null;
        if (resumeId && jobPostingId) {
            const { data: existing } = await supabase
                .from("rewritten_resumes")
                .select("id, last_adapted_at")
                .eq("resume_id", resumeId)
                .eq("job_posting_id", jobPostingId)
                .maybeSingle();
            existingAdaptedResume = existing;
        }

        if (existingAdaptedResume) {
            // Rate limiting for updates
            if (existingAdaptedResume.last_adapted_at) {
                const lastAdapted = new Date(existingAdaptedResume.last_adapted_at);
                const now = new Date();
                const diffMinutes = (now.getTime() - lastAdapted.getTime()) / (1000 * 60);
                
                if (diffMinutes < RATE_LIMIT_MINUTES) {
                    return NextResponse.json({ error: RATE_LIMIT_ERROR_MESSAGE }, { status: 429 });
                }
            }

            // UPDATE existing adapted resume
            const { data: updated, error: updateError } = await supabase
                .from("rewritten_resumes")
                .update({
                    content: serializedContent,
                    structured_data: parsedData,
                    file_name: parsedData.personalInfo.name || "resume",
                    last_adapted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existingAdaptedResume.id)
                .select(`
                    id, content, structured_data, resume_id, variant, theme, 
                    pdf_url, pdf_path, created_at, updated_at, file_name, job_posting_id
                `)
                .single();

            if (updateError || !updated) {
                console.error("Failed to update adapted resume:", updateError);
                return NextResponse.json({ error: "Failed to update adapted resume" }, { status: 500 });
            }

            const item = {
                ...updated,
                job_title: derivedJobTitle,
                job_company: derivedJobCompany,
            };

            userLogger.requestComplete(200, { action: "updated", resumeId: existingAdaptedResume.id });
            return NextResponse.json({ item, resumeData: parsedData, updated: true });
        }

        // Check limit only for new inserts
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

        // INSERT new adapted resume
        const { data: saved, error: insertError } = await supabase
            .from("rewritten_resumes")
            .insert({
                user_id: user.id,
                resume_id: resumeId || null,
                job_posting_id: jobPostingId,
                content: serializedContent,
                structured_data: parsedData,
                format: "json",
                variant: defaultResumeVariant,
                theme: "light",
                file_name: parsedData.personalInfo.name || "resume",
                last_adapted_at: new Date().toISOString(),
            })
            .select(`
                id, content, structured_data, resume_id, variant, theme, 
                pdf_url, pdf_path, created_at, updated_at, file_name, job_posting_id
            `)
            .single();

        if (insertError || !saved) {
            console.error("Failed to save adapted resume:", insertError);
            return NextResponse.json({ error: "Failed to save adapted resume" }, { status: 500 });
        }

        // Return with flattened job data for backward compatibility
        const item = {
            ...saved,
            job_title: derivedJobTitle,
            job_company: derivedJobCompany,
        };

        userLogger.requestComplete(200, { action: "created", resumeId: saved.id });
        return NextResponse.json({ item, resumeData: parsedData });
    } catch (error: any) {
        const logger = createLogger("adapt-resume");
        logger.error("unhandled_error", { message: error.message, stack: error.stack });
        return NextResponse.json(
            { error: error.message || "Failed to adapt resume" },
            { status: 500 }
        );
    }
}
