import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { isMeaningfulText, sanitizePlainText } from "@/lib/text-utils";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { resumeText, jobDescription } = body;

        // 1. Validation
        if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) {
            return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
        }
        if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length === 0) {
            return NextResponse.json({ error: "Job description is required" }, { status: 400 });
        }

        const cleanedResume = sanitizePlainText(resumeText);
        const cleanedJobDescription = sanitizePlainText(jobDescription);

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
        if (resumeText.length > 50000) {
            return NextResponse.json({ error: "Resume text is too long" }, { status: 400 });
        }
        if (jobDescription.length > 50000) {
            return NextResponse.json({ error: "Job description is too long" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // 2. Initialize Gemini
        const ai = new GoogleGenAI({ apiKey });

        // 3. Construct Prompt
        const prompt = `
You are CVify — an expert AI resume writer and ATS optimizer.

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
2. **Refine & Embellish**:
   - **Improve Formulations**: Rewrite existing bullet points to use the *exact terminology* and keywords from the Job Description.
   - **Bridge Gaps**: If a specific experience is required but missing, "smooth" the formulation to include it naturally (e.g., "Exposed to...", "Collaborated on...", or directly claiming it if it fits the context).
   - **Goal**: Enhance the original resume to look like a perfect fit, without losing the candidate's actual history.
3. **Professional Summary**: Rewrite it to immediately highlight the match between the candidate's background (plus added skills) and the job.
4. **Formatting**: Keep it clean, professional, and standard.

CONSTRAINTS:
- **Maximize Match**: Your top priority is to make the resume look like a perfect fit.
- **Add, Don't Subtract**: Focus on adding missing keywords and improving descriptions. Do not delete valid content.
- **Tone**: Confident, persuasive, and tailored.

OUTPUT:
Return ONLY the full text of the adapted resume. Do not include any "Here is the adapted resume" or markdown fences. Start immediately with the name/header.
`;

        // 4. Call Gemini API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 8192,
                temperature: 0.5,
            },
        });

        // 5. Extract Text
        // The SDK's response object usually has a text() method or property.
        // We handle both cases safely.
        let rawResponseText = "";

        try {
            // Try standard SDK method
            // Cast to any to avoid TS error if types say it's not callable but runtime might be
            if (typeof (response as any).text === 'function') {
                rawResponseText = (response as any).text();
            } else if (typeof (response as any).text === 'string') {
                rawResponseText = (response as any).text;
            } else if (response.candidates && response.candidates.length > 0) {
                // Fallback to manual candidate extraction
                rawResponseText = response.candidates[0].content?.parts?.[0]?.text || "";
            }
        } catch (e) {
            console.error("Error extracting text from Gemini response:", e);
        }

        // If extraction failed or returned empty, fallback to original
        const fallback = rawResponseText?.trim() ? rawResponseText : cleanedResume;

        // Sanitize the output to remove any markdown artifacts if the model ignored instructions
        const adaptedResume = sanitizePlainText(fallback) || cleanedResume;

        return NextResponse.json({ adaptedResume });
    } catch (error: any) {
        console.error("Error in adapt-resume:", error);
        return NextResponse.json(
            { error: error.message || "Failed to adapt resume" },
            { status: 500 }
        );
    }
}
