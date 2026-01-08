import { NextRequest, NextResponse } from "next/server";
import { isMeaningfulText, sanitizePlainText } from "@/lib/text-utils";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseMarkdownToResumeData } from "@/lib/resume-parser-structured";
import { defaultResumeVariant } from "@/lib/resume-templates/variants";
import { createLLMClient, LLMError, LLM_MODELS, cleanJsonResponse, isLikelyRefusalResponse, getRefusalInfo } from "@/lib/api/llm";
import { createLogger } from "@/lib/api/logger";
import type { ResumeData } from "@/lib/resume-templates/types";
import {
    MAX_ADAPTED_RESUMES,
    ADAPTED_RESUME_LIMIT_ERROR,
    MAX_CONTENT_LENGTH,
    AI_REFUSAL_ERROR
} from "@/lib/constants";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    const logger = createLogger("improve-resume");

    try {
        if (!isSupabaseConfigured()) {
            logger.error("supabase_not_configured");
            return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
        }

        const supabase = await getSupabaseServerClient();

        // Rate limit by IP first
        const clientIp = getClientIp(req);
        const ipLimit = await checkRateLimit(supabase, `ip:${clientIp}`);
        if (!ipLimit.allowed) {
            logger.warn("ip_rate_limit_exceeded", { ip: clientIp });
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429, headers: rateLimitHeaders(ipLimit.remaining, ipLimit.resetAt) }
            );
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            logger.warn("unauthorized_request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limit by user
        const userLimit = await checkRateLimit(supabase, `user:${user.id}`);
        if (!userLimit.allowed) {
            logger.warn("user_rate_limit_exceeded", { userId: user.id });
            return NextResponse.json(
                { error: "Rate limit exceeded." },
                { status: 429, headers: rateLimitHeaders(userLimit.remaining, userLimit.resetAt) }
            );
        }

        const userLogger = createLogger("improve-resume", user.id);
        userLogger.requestStart("/api/improve-resume");

        const body = await req.json();
        const { resumeText, resumeId, targetRole, improvements } = body;

        // Validation
        if ((!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) && !resumeId) {
            userLogger.warn("validation_failed", { reason: "missing_resume" });
            return NextResponse.json({ error: "Resume text or resumeId is required" }, { status: 400 });
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

        if (!isMeaningfulText(cleanedResume)) {
            return NextResponse.json(
                { error: "The provided text is not a valid resume. Please upload your resume." },
                { status: 400 }
            );
        }

        if (cleanedResume.length > MAX_CONTENT_LENGTH) {
            return NextResponse.json({ error: "Resume text is too long" }, { status: 400 });
        }

        // Check resume limit
        const { count: existingCount } = await supabase
            .from("rewritten_resumes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);

        if ((existingCount ?? 0) >= MAX_ADAPTED_RESUMES) {
            userLogger.warn("resume_limit_reached", { count: existingCount });
            return NextResponse.json({ error: ADAPTED_RESUME_LIMIT_ERROR }, { status: 429 });
        }

        // Build improvement instructions
        const improvementFocus = improvements?.length > 0
            ? improvements.join(", ")
            : "ATS optimization, clarity, impact, keywords";

        const targetRoleContext = targetRole
            ? `The candidate is targeting roles like: ${targetRole}. Optimize the resume for these types of positions.`
            : "";

        const prompt = `
You are ImpreCV — an expert AI resume writer and ATS optimizer.

TASK:
Improve the candidate's resume to make it more professional, ATS-friendly, and impactful. This is a GENERAL improvement, not tailored to a specific job posting.

INPUT RESUME:
${cleanedResume}

${targetRoleContext}

IMPROVEMENT FOCUS:
${improvementFocus}

CRITICAL INSTRUCTIONS:
1. **ATS Optimization**:
   - Use standard section headings (Summary, Experience, Education, Skills)
   - Include relevant industry keywords naturally
   - Avoid tables, graphics, or complex formatting descriptions
   - Use common job title variations

2. **Content Enhancement**:
   - Strengthen weak bullet points with action verbs and metrics
   - Quantify achievements wherever possible (%, $, #)
   - Remove redundant or filler phrases
   - Ensure consistency in tense and formatting

3. **Professional Polish**:
   - Improve the professional summary to be compelling
   - Organize skills by relevance and category
   - Ensure dates and formatting are consistent
   - Remove outdated or irrelevant information

4. **Preserve Authenticity**:
   - Keep all real experience, education, and achievements
   - Do NOT invent new positions, companies, or qualifications
   - Maintain the candidate's voice while improving clarity

OUTPUT FORMAT - ABSOLUTE REQUIREMENTS:

CRITICAL: Your response MUST be a valid JSON object.
- Your response MUST start with '{' and end with '}'
- Do NOT include ANY text before or after the JSON object
- Do NOT wrap in markdown code blocks (no \`\`\`json)
- Do NOT include comments or explanations
- Return ONLY the raw JSON string
- If you must refuse or cannot comply, return ONLY:
  {"status":"refused","message":"...","refusalReason":"..."}

SECTION CONTENT RULES:
1. **Simple Text Sections** (summary, skills, languages): Use a PLAIN STRING
   - "content": "Text content here..."
   - If empty: "content": ""
   
2. **Structured List Sections** (experience, education, projects, certifications): Use ARRAY OF OBJECTS
   - Each object MUST have: "title", optionally "subtitle", "date", "description", "bullets"
   - "content": [{ "title": "...", "subtitle": "...", "date": "...", "bullets": ["..."] }]
   - If section exists but has no items: "content": []

MINIMAL VALID JSON TEMPLATE:

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
`;

        // Initialize LLM client
        let llmClient;
        try {
            llmClient = createLLMClient("[Improve]");
        } catch (error) {
            if (error instanceof LLMError && error.type === "API_KEY_MISSING") {
                userLogger.error("api_key_missing");
                return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
            }
            throw error;
        }

        userLogger.info("llm_request_started", { model: LLM_MODELS.PRIMARY });

        let rawResponse: string;
        let modelUsed: string = LLM_MODELS.PRIMARY;
        let usedFallback = false;
        try {
            const response = await llmClient.generate(prompt, {
                model: LLM_MODELS.PRIMARY,
                configType: "adaptation",
                enableFallback: true,
                logPrefix: "[Improve]"
            });
            rawResponse = response.text;
            modelUsed = response.model;
            usedFallback = response.usedFallback;
        } catch (error) {
            if (error instanceof LLMError) {
                userLogger.error("llm_error");
                if (error.type === "RATE_LIMIT") {
                    return NextResponse.json({
                        error: "AI service is temporarily overloaded. Please try again in a few moments."
                    }, { status: 429 });
                }
                return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 503 });
            }
            throw error;
        }

        userLogger.info("llm_response_received", { responseLength: rawResponse.length });

        if (isLikelyRefusalResponse(rawResponse)) {
            userLogger.warn("llm_refusal_detected", { model: modelUsed, usedFallback });
            userLogger.requestComplete(422, { reason: "llm_refusal" });
            return NextResponse.json({ error: AI_REFUSAL_ERROR, blocked: true }, { status: 422 });
        }

        // Parse the response
        let parsedData: ResumeData;
        const cleanedResponse = cleanJsonResponse(rawResponse);
        let parsedJson: unknown = null;

        try {
            parsedJson = JSON.parse(cleanedResponse);
        } catch {
            userLogger.error("json_parse_failed");
        }

        const refusalInfo = getRefusalInfo(parsedJson);
        if (refusalInfo) {
            userLogger.warn("llm_refusal_detected", { model: modelUsed, usedFallback });
            userLogger.requestComplete(422, { reason: "llm_refusal" });
            return NextResponse.json(
                {
                    error: refusalInfo.message || AI_REFUSAL_ERROR,
                    blocked: true,
                    refusalReason: refusalInfo.refusalReason || null,
                },
                { status: 422 }
            );
        }

        if (parsedJson && typeof parsedJson === "object") {
            parsedData = parsedJson as ResumeData;
        } else {
            // Try markdown fallback
            try {
                parsedData = parseMarkdownToResumeData(rawResponse);
                userLogger.info("markdown_fallback_success");
            } catch {
                userLogger.error("markdown_fallback_failed");
                return NextResponse.json(
                    { error: "Failed to parse AI response. Please try again." },
                    { status: 500 }
                );
            }
        }

        // Validate parsed data
        if (!parsedData.personalInfo || !parsedData.sections) {
            userLogger.error("invalid_resume_structure");
            return NextResponse.json(
                { error: "Invalid resume structure from AI. Please try again." },
                { status: 500 }
            );
        }

        const resumeName = targetRole
            ? `${parsedData.personalInfo.name || "Resume"} - ${targetRole}`
            : `${parsedData.personalInfo.name || "Resume"} - Improved`;

        const { data: newResume, error: insertError } = await supabase
            .from("rewritten_resumes")
            .insert({
                user_id: user.id,
                resume_id: resumeId || null,
                content: JSON.stringify(parsedData),
                structured_data: parsedData,
                format: "json",
                mode: "improved",
                source_type: resumeId ? "upload" : "paste",
                original_text: cleanedResume,
                name: resumeName,
                variant: defaultResumeVariant,
                theme: "light",
            })
            .select("id, variant, theme, pdf_url, name, mode")
            .single();

        if (insertError || !newResume) {
            userLogger.error("db_insert_failed");
            return NextResponse.json(
                { error: "Failed to save improved resume" },
                { status: 500 }
            );
        }

        userLogger.requestComplete(200, { resumeId: newResume.id, mode: "improved" });

        return NextResponse.json({
            item: {
                id: newResume.id,
                variant: newResume.variant,
                theme: newResume.theme,
                pdf_url: newResume.pdf_url,
                name: newResume.name,
                mode: newResume.mode,
            },
            resumeData: parsedData,
        });

    } catch {
        logger.error("unhandled_error");
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
