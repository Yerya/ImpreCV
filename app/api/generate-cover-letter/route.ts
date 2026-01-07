import { NextResponse, type NextRequest } from "next/server"
import { deriveJobMetadata, normalizeJobLink } from "@/lib/job-posting"
import { fetchJobPostingFromUrl } from "@/lib/job-posting-server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { isMeaningfulText, sanitizePlainText } from "@/lib/text-utils"
import { createLLMClient, LLMError, LLM_MODELS, isLikelyRefusalResponse, parseRefusalInfo } from "@/lib/api/llm"
import { createLogger } from "@/lib/api/logger"
import { MAX_CONTENT_LENGTH, AI_REFUSAL_ERROR } from "@/lib/constants"
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit"

const buildPrompt = (input: { resume: string; job: string; role: string; company?: string }) => {
  return `You are ImpreCV, an AI career coach who writes concise, human cover letters (no templates).

ROLE: ${input.role}${input.company ? ` at ${input.company}` : ""}

RESUME (verbatim):
${input.resume}

JOB DESCRIPTION (verbatim):
${input.job}

GUIDELINES:
- Write 3-4 short paragraphs in natural language; avoid bullet points and generic filler.
- Reference 2-3 concrete achievements from the resume that align with the job description. Use metrics if present.
- Mirror the tone of the job description (formal vs. dynamic) and name the role/company early.
- Do not invent experience, dates, or contact details. If a detail is missing, skip it gracefully.
- Keep it under 260 words, ready to paste into an email. Return plain text only.
- If you must refuse or cannot comply, return ONLY this JSON:
  {"status":"refused","message":"...","refusalReason":"..."}`
}

export async function POST(request: NextRequest) {
  const logger = createLogger("cover-letter")

  try {
    if (!isSupabaseConfigured()) {
      logger.error("supabase_not_configured")
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 })
    }

    const supabase = await getSupabaseServerClient()

    // Rate limit by IP first
    const clientIp = getClientIp(request);
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
    } = await supabase.auth.getUser()

    if (!user) {
      logger.warn("unauthorized_request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const userLogger = createLogger("cover-letter", user.id)
    userLogger.requestStart("/api/generate-cover-letter")

    const body = await request.json().catch(() => ({}))
    const { rewrittenResumeId, jobDescription, jobLink } = body || {}

    if (!rewrittenResumeId) {
      userLogger.warn("validation_failed", { reason: "missing_resume_id" })
      return NextResponse.json({ error: "rewrittenResumeId is required" }, { status: 400 })
    }

    // Fetch rewritten resume with job data
    const { data: rewrittenResume, error: resumeError } = await supabase
      .from("rewritten_resumes")
      .select(`
        id, user_id, structured_data, content, file_name, job_posting_id,
        job_posting:job_postings(id, title, company, description, link)
      `)
      .eq("id", rewrittenResumeId)
      .single()

    if (resumeError || !rewrittenResume) {
      return NextResponse.json({ error: "Rewritten resume not found" }, { status: 404 })
    }

    if (rewrittenResume.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Extract job posting data
    const jobPostingData = rewrittenResume.job_posting as {
      id?: string; title?: string; company?: string; description?: string; link?: string
    } | null;

    const normalizedLink = typeof jobLink === "string" ? normalizeJobLink(jobLink) : ""
    let cleanedResume = ""
    let cleanedJobDescription = ""
    let jobTitle = ""
    let jobCompany: string | undefined

    // Use adapted resume content
    cleanedResume = sanitizePlainText(
      typeof rewrittenResume.structured_data === "object"
        ? JSON.stringify(rewrittenResume.structured_data)
        : rewrittenResume.content || ""
    )

    // 1. First try database stored job description (preferred)
    if (jobPostingData?.description) {
      cleanedJobDescription = jobPostingData.description
      jobTitle = jobPostingData.title || ""
      jobCompany = jobPostingData.company || undefined
    }

    // 2. Fallback: client-provided job description (for older resumes)
    if (!cleanedJobDescription) {
      cleanedJobDescription = sanitizePlainText(jobDescription || "")
    }

    // 3. Fallback: fetch from link (either from job_posting or client-provided)
    if (!cleanedJobDescription && (jobPostingData?.link || normalizedLink)) {
      const linkToFetch = jobPostingData?.link || normalizedLink;
      try {
        const fetched = await fetchJobPostingFromUrl(linkToFetch)
        cleanedJobDescription = sanitizePlainText(fetched)
      } catch (error) {
        console.error("Failed to fetch job posting for cover letter:", error)
        return NextResponse.json(
          { error: "Failed to fetch job posting from the provided link. Please try pasting the description." },
          { status: 400 },
        )
      }
    }

    console.log("[Cover Letter API] Cleaned data:", {
      resumeLength: cleanedResume.length,
      jobDescriptionLength: cleanedJobDescription.length,
      rewrittenResumeId,
    })

    if (!isMeaningfulText(cleanedJobDescription)) {
      userLogger.warn("validation_failed", { reason: "no_job_description" })
      return NextResponse.json(
        { error: "No job description found. Please re-adapt your resume to store job data." },
        { status: 400 },
      )
    }

    const looksValid = isMeaningfulText(cleanedResume) && isMeaningfulText(cleanedJobDescription)
    if (!looksValid) {
      userLogger.warn("validation_failed", {
        reason: "invalid_text",
        resumeValid: isMeaningfulText(cleanedResume),
        jobValid: isMeaningfulText(cleanedJobDescription)
      })
      return NextResponse.json(
        {
          error: "The provided text is not a valid resume or job description. Please upload your resume and vacancy details.",
        },
        { status: 400 },
      )
    }

    if (cleanedResume.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: "Resume text is too long" }, { status: 400 })
    }
    if (cleanedJobDescription.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: "Job description is too long" }, { status: 400 })
    }

    const derivedMeta = deriveJobMetadata(cleanedJobDescription, normalizedLink)
    if (!jobTitle) {
      jobTitle = derivedMeta.title || "Job Opportunity"
    }
    if (!jobCompany) {
      jobCompany = derivedMeta.company || undefined
    }

    // Initialize LLM client with automatic fallback support
    let llmClient
    try {
      llmClient = createLLMClient("[Cover Letter]")
    } catch (error) {
      if (error instanceof LLMError && error.type === "API_KEY_MISSING") {
        userLogger.error("api_key_missing")
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
      }
      throw error
    }

    const prompt = buildPrompt({
      resume: cleanedResume,
      job: cleanedJobDescription,
      role: jobTitle || "Target Role",
      company: jobCompany || undefined,
    })

    // Call LLM with automatic fallback (gemini-2.5-flash → gemini-2.0-flash)
    let content = ""
    let modelUsed: string = LLM_MODELS.PRIMARY
    try {
      const response = await llmClient.generate(prompt, {
        model: LLM_MODELS.PRIMARY,
        configType: "coverLetter",
        enableFallback: true,
        logPrefix: "[Cover Letter]"
      })
      const rawText = response.text
      const refusalInfo = parseRefusalInfo(rawText)
      if (refusalInfo) {
        userLogger.warn("llm_refusal_detected", { model: response.model, usedFallback: response.usedFallback })
        userLogger.requestComplete(422, { reason: "llm_refusal" })
        return NextResponse.json({
          error: refusalInfo.message || AI_REFUSAL_ERROR,
          blocked: true,
          refusalReason: refusalInfo.refusalReason || null,
        }, { status: 422 })
      }
      if (isLikelyRefusalResponse(rawText)) {
        userLogger.warn("llm_refusal_detected", { model: response.model, usedFallback: response.usedFallback })
        userLogger.requestComplete(422, { reason: "llm_refusal" })
        return NextResponse.json({ error: AI_REFUSAL_ERROR, blocked: true }, { status: 422 })
      }
      content = rawText.trim()
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
      return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 })
    }

    console.log("[Cover Letter API] Generated content length:", content.length)

    if (!content) {
      userLogger.warn("empty_response")
      userLogger.requestComplete(500, { reason: "empty_response" })
      return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 })
    }

    let coverLetterId: string | null = null
    let warning: string | null = null

    // Check if cover letter already exists for this resume (one per resume policy)
    const { data: existingCoverLetter } = await supabase
      .from("cover_letters")
      .select("id")
      .eq("rewritten_resume_id", rewrittenResumeId)
      .maybeSingle()

    if (existingCoverLetter) {
      // Update existing cover letter instead of creating new one
      const { data: updatedCoverLetter, error: updateError } = await supabase
        .from("cover_letters")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", existingCoverLetter.id)
        .select("id")
        .single()

      if (updateError || !updatedCoverLetter) {
        userLogger.warn("db_update_failed", { error: updateError?.message })
        warning = "Cover letter generated but could not be saved. Copy it now."
      } else {
        coverLetterId = updatedCoverLetter.id
      }
    } else {
      // Create new cover letter
      const { data: newCoverLetter, error: insertError } = await supabase
        .from("cover_letters")
        .insert({
          user_id: user.id,
          content,
          rewritten_resume_id: rewrittenResumeId,
        })
        .select("id")
        .single()

      if (insertError || !newCoverLetter) {
        userLogger.warn("db_insert_failed", { error: insertError?.message })
        warning = "Cover letter generated but could not be saved. Copy it now."
      } else {
        coverLetterId = newCoverLetter.id
      }
    }

    userLogger.requestComplete(200, {
      coverLetterId,
      action: existingCoverLetter ? "updated" : "created"
    })
    return NextResponse.json({
      coverLetterId,
      content,
      warning,
      metadata: { title: jobTitle, company: jobCompany },
    })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const logger = createLogger("cover-letter")
    logger.error("unhandled_error", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
