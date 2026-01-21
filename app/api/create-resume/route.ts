import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { defaultResumeVariant } from "@/lib/resume-templates/variants";
import { createLLMClient, LLMError, LLM_MODELS, cleanJsonResponse, isLikelyRefusalResponse, getRefusalInfo } from "@/lib/api/llm";
import { createLogger } from "@/lib/api/logger";
import type { ResumeData } from "@/lib/resume-templates/types";
import {
    MAX_ADAPTED_RESUMES,
    ADAPTED_RESUME_LIMIT_ERROR,
    AI_REFUSAL_ERROR,
} from "@/lib/constants";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

interface CreateResumeInput {
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    targetRole: string;
    yearsOfExperience?: string;
    experience?: Array<{
        title: string;
        company: string;
        location?: string;
        startDate: string;
        endDate?: string;
        current?: boolean;
        responsibilities?: string;
    }>;
    education?: Array<{
        degree: string;
        institution: string;
        location?: string;
        graduationDate?: string;
        gpa?: string;
    }>;
    skills?: string;
    certifications?: string;
    languages?: string;
    additionalInfo?: string;
}

export async function POST(req: NextRequest) {
    const logger = createLogger("create-resume");

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

        const userLogger = createLogger("create-resume", user.id);
        userLogger.requestStart("/api/create-resume");

        const body = await req.json() as CreateResumeInput;
        const { fullName, targetRole } = body;

        // Validation
        if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
            userLogger.warn("validation_failed", { reason: "missing_name" });
            return NextResponse.json({ error: "Full name is required" }, { status: 400 });
        }

        if (!targetRole || typeof targetRole !== "string" || targetRole.trim().length === 0) {
            userLogger.warn("validation_failed", { reason: "missing_target_role" });
            return NextResponse.json({ error: "Target role is required" }, { status: 400 });
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

        // Build user input summary for the prompt
        const experienceText = body.experience?.map(exp =>
            `- ${exp.title} at ${exp.company}${exp.location ? `, ${exp.location}` : ''} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'})${exp.responsibilities ? `\n  ${exp.responsibilities}` : ''}`
        ).join('\n') || 'No experience provided';

        const educationText = body.education?.map(edu =>
            `- ${edu.degree} from ${edu.institution}${edu.location ? `, ${edu.location}` : ''}${edu.graduationDate ? ` (${edu.graduationDate})` : ''}${edu.gpa ? ` - GPA: ${edu.gpa}` : ''}`
        ).join('\n') || 'No education provided';

        const prompt = `
You are ImpreCV — an expert AI resume writer specializing in creating professional, ATS-optimized resumes from scratch.

TASK:
Create a complete, professional resume for the candidate based on the information provided. Fill in gaps intelligently while staying truthful to the provided information.

CANDIDATE INFORMATION:
Name: ${fullName}
Email: ${body.email || ""}
Phone: ${body.phone || ""}
Location: ${body.location || ""}
LinkedIn: ${body.linkedin || ""}
Website: ${body.website || ""}

Target Role: ${targetRole}
Years of Experience: ${body.yearsOfExperience || 'Not specified'}

EXPERIENCE:
${experienceText}

EDUCATION:
${educationText}

SKILLS:
${body.skills || 'Not provided - infer relevant skills from experience and target role'}

CERTIFICATIONS:
${body.certifications || 'None provided'}

LANGUAGES:
${body.languages || 'Not provided'}

ADDITIONAL INFORMATION:
${body.additionalInfo || 'None'}

CRITICAL INSTRUCTIONS:
1. **Professional Summary**: Create a compelling 2-3 sentence summary highlighting the candidate's value proposition for ${targetRole} roles.

2. **Experience Enhancement**:
   - Transform provided responsibilities into impactful, metric-driven bullet points
   - Use strong action verbs (Led, Developed, Implemented, Achieved, etc.)
   - Add relevant quantifiable metrics where logical (%, $, #, timeframes)
   - Keep 3-5 bullets per position

3. **Skills Section**:
   - If skills were provided, organize them by category
   - If not provided, infer relevant skills from experience and target role
   - Include both technical and soft skills relevant to ${targetRole}

4. **ATS Optimization**:
   - Use standard section headings
   - Include industry-relevant keywords for ${targetRole}
   - Keep formatting simple and parseable

5. **Authenticity Rules**:
   - Only use information that was provided or can be logically inferred
   - Do NOT invent specific companies, dates, degrees, or certifications
   - If contact info wasn't provided, use empty strings

OUTPUT FORMAT - ABSOLUTE REQUIREMENTS:

CRITICAL: Your response MUST be a valid JSON object.
- Your response MUST start with '{' and end with '}'
- Do NOT include ANY text before or after the JSON object
- Do NOT wrap in markdown code blocks
- Return ONLY the raw JSON string
- If you must refuse or cannot comply, return ONLY:
  {"status":"refused","message":"...","refusalReason":"..."}

{
  "personalInfo": {
    "name": "${fullName}",
    "title": "${targetRole}",
    "email": "${body.email || ''}",
    "phone": "${body.phone || ''}",
    "location": "${body.location || ''}",
    "linkedin": "${body.linkedin || ''}",
    "website": "${body.website || ''}"
  },
  "sections": [
    {
      "type": "summary",
      "title": "Professional Summary",
      "content": "Compelling summary text..."
    },
    {
      "type": "experience",
      "title": "Work Experience",
      "content": [
        {
          "title": "Job Title",
          "subtitle": "Company Name, Location",
          "date": "Start Date - End Date",
          "bullets": ["Achievement 1", "Achievement 2", "Achievement 3"]
        }
      ]
    },
    {
      "type": "education",
      "title": "Education",
      "content": [
        {
          "title": "Degree Name",
          "subtitle": "Institution Name, Location",
          "date": "Graduation Date"
        }
      ]
    },
    {
      "type": "skills",
      "title": "Skills",
      "content": "Skill 1, Skill 2, Skill 3..."
    }
  ]
}

Include additional sections (certifications, languages, projects) only if relevant information was provided.
`;

        // Initialize LLM client
        let llmClient;
        try {
            llmClient = createLLMClient("[Create]");
        } catch (error) {
            if (error instanceof LLMError && error.type === "API_KEY_MISSING") {
                userLogger.error("api_key_missing");
                return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
            }
            throw error;
        }

        userLogger.info("llm_request_started", { model: LLM_MODELS.PRIMARY, targetRole });

        let rawResponse: string;
        let modelUsed: string = LLM_MODELS.PRIMARY;
        let usedFallback = false;
        try {
            const response = await llmClient.generate(prompt, {
                model: LLM_MODELS.PRIMARY,
                configType: "creation",
                enableFallback: true,
                logPrefix: "[Create]"
            });
            rawResponse = response.text;
            modelUsed = response.model;
            usedFallback = response.usedFallback;
        } catch (error) {
            // Check for blocked response (SAFETY, MAX_TOKENS, etc.)
            if (error instanceof Error && (error as any).code === "BLOCKED_RESPONSE") {
                const blockError = error as Error & { finishReason?: string }
                userLogger.warn("llm_blocked_response", { finishReason: blockError.finishReason })

                return NextResponse.json({
                    error: blockError.finishReason === "SAFETY"
                        ? "The AI couldn't process this resume due to safety filters. Please try rephrasing sensitive information."
                        : blockError.finishReason === "MAX_TOKENS"
                            ? "The resume is too long to process. Please shorten it and try again."
                            : blockError.message || "AI service couldn't process this request"
                }, { status: 422 })
            }

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

        if (!rawResponse || rawResponse.trim().length === 0) {
            userLogger.error("empty_llm_response", undefined, { model: modelUsed, usedFallback });
            return NextResponse.json({
                error: "AI returned an empty response. Please try again."
            }, { status: 500 });
        }

        if (isLikelyRefusalResponse(rawResponse)) {
            userLogger.warn("llm_refusal_detected", { model: modelUsed, usedFallback });
            userLogger.requestComplete(422, { reason: "llm_refusal" });
            return NextResponse.json({ error: AI_REFUSAL_ERROR, blocked: true }, { status: 422 });
        }

        // Parse the response
        const cleanedResponse = cleanJsonResponse(rawResponse);
        let parsedJson: unknown = null;

        try {
            parsedJson = JSON.parse(cleanedResponse);
        } catch {
            userLogger.error("json_parse_failed");
            return NextResponse.json(
                { error: "Failed to parse AI response. Please try again." },
                { status: 500 }
            );
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

        const parsedData = parsedJson as ResumeData;

        // Validate parsed data
        if (!parsedData.personalInfo || !parsedData.sections) {
            userLogger.error("invalid_resume_structure");
            return NextResponse.json(
                { error: "Invalid resume structure from AI. Please try again." },
                { status: 500 }
            );
        }

        const resumeName = `${fullName} - ${targetRole}`;

        const { data: newResume, error: insertError } = await supabase
            .from("rewritten_resumes")
            .insert({
                user_id: user.id,
                resume_id: null,
                content: JSON.stringify(parsedData),
                structured_data: parsedData,
                format: "json",
                mode: "created",
                source_type: "scratch",
                original_text: null,
                name: resumeName,
                variant: defaultResumeVariant,
                theme: "light",
            })
            .select("id, variant, theme, pdf_url, name, mode")
            .single();

        if (insertError || !newResume) {
            userLogger.error("db_insert_failed");
            return NextResponse.json(
                { error: "Failed to save created resume" },
                { status: 500 }
            );
        }

        userLogger.requestComplete(200, { resumeId: newResume.id, mode: "created" });

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
