import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { fetchJobPostingFromUrl } from "@/lib/job-posting-server"
import { sanitizePlainText, isMeaningfulText } from "@/lib/text-utils"
import { deriveJobMetadata } from "@/lib/job-posting"
import { createLLMClient, LLMError, LLM_MODELS, cleanJsonResponse, isLikelyRefusalResponse, getRefusalInfo } from "@/lib/api/llm"
import { createLogger } from "@/lib/api/logger"
import { AI_REFUSAL_ERROR } from "@/lib/constants"
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit"
import type { SkillMapData, Skill, RoadmapItem, AdaptationHighlight } from "@/types/skill-map"

// Prompt for analyzing ORIGINAL resume vs job description (skill gap analysis)
const buildGapAnalysisPrompt = (originalResumeText: string, jobDescription: string) => {
  return `Analyze resume against job requirements. Return JSON only.

RESUME:
${originalResumeText}

JOB DESCRIPTION:
${jobDescription}

Return this JSON:
{
  "matchScore": <0-100>,
  "summary": "<1-2 sentences about fit>",
  "matchedSkills": [{"name": "<skill>", "priority": "high|medium|low", "category": "matched"}],
  "transferableSkills": [{"name": "<skill>", "priority": "high|medium|low", "category": "transferable"}],
  "missingSkills": [{"name": "<skill>", "priority": "high|medium|low", "category": "missing"}],
  "interviewTips": ["<tip1>", "<tip2>", "<tip3>"]
}
If you must refuse or cannot comply, return ONLY:
{"status":"refused","message":"...","refusalReason":"..."}

Rules:
- matched: skills in BOTH resume and job
- transferable: related skills from resume applicable to job
- missing: job requirements NOT in resume
- priority: high=must-have, medium=nice-to-have, low=bonus
- Keep skill names concise (1-3 words)
- Max 5 skills per category`
}

// Prompt for comparing original vs adapted resume (adaptation quality)
const buildAdaptationPrompt = (
  originalResumeText: string,
  adaptedResumeData: string,
  jobDescription: string
) => {
  return `Compare ADAPTED resume vs ORIGINAL for this job. Return JSON only.

ORIGINAL RESUME:
${originalResumeText}

ADAPTED RESUME:
${adaptedResumeData}

JOB DESCRIPTION:
${jobDescription}

Return this JSON:
{
  "adaptationScore": <0-100 how well adapted version aligns with job>,
  "adaptationSummary": "<1-2 sentences about key improvements>"
}
If you must refuse or cannot comply, return ONLY:
{"status":"refused","message":"...","refusalReason":"..."}

Focus on: keyword alignment, skill emphasis, experience reframing.`
}

const validateSkillMapData = (data: unknown): SkillMapData => {
  const defaultData: SkillMapData = {
    matchScore: 0,
    matchedSkills: [],
    transferableSkills: [],
    missingSkills: [],
    learningRoadmap: [],
    summary: "",
    interviewTips: [],
  }

  if (!data || typeof data !== "object") return defaultData

  const record = data as Record<string, unknown>

  const validateSkill = (skill: unknown, category: Skill["category"]): Skill | null => {
    if (!skill || typeof skill !== "object") return null
    const s = skill as Record<string, unknown>
    if (typeof s.name !== "string") return null
    return {
      name: s.name,
      priority: ["high", "medium", "low"].includes(s.priority as string) ? s.priority as Skill["priority"] : "medium",
      category,
      resumeEvidence: typeof s.resumeEvidence === "string" ? s.resumeEvidence : undefined,
      jobRequirement: typeof s.jobRequirement === "string" ? s.jobRequirement : undefined,
      matchPercentage: typeof s.matchPercentage === "number" ? s.matchPercentage : undefined,
      potentialScoreIncrease: typeof s.potentialScoreIncrease === "number" ? s.potentialScoreIncrease : undefined,
    }
  }

  const validateRoadmapItem = (item: unknown): RoadmapItem | null => {
    if (!item || typeof item !== "object") return null
    const i = item as Record<string, unknown>
    if (typeof i.skill !== "string") return null
    return {
      skill: i.skill,
      importance: typeof i.importance === "string" ? i.importance : "",
      firstStep: typeof i.firstStep === "string" ? i.firstStep : "",
      potentialScoreIncrease: typeof i.potentialScoreIncrease === "number" ? i.potentialScoreIncrease : 0,
    }
  }

  const validateAdaptationHighlight = (item: unknown): AdaptationHighlight | null => {
    if (!item || typeof item !== "object") return null
    const i = item as Record<string, unknown>
    if (typeof i.skill !== "string") return null
    return {
      skill: i.skill,
      originalPresentation: typeof i.originalPresentation === "string" ? i.originalPresentation : "",
      adaptedPresentation: typeof i.adaptedPresentation === "string" ? i.adaptedPresentation : "",
      improvement: typeof i.improvement === "string" ? i.improvement : "",
    }
  }

  return {
    matchScore: typeof record.matchScore === "number" ? Math.min(100, Math.max(0, record.matchScore)) : 0,
    matchedSkills: Array.isArray(record.matchedSkills)
      ? (record.matchedSkills as unknown[]).map((s) => validateSkill(s, "matched")).filter((s): s is Skill => s !== null)
      : [],
    transferableSkills: Array.isArray(record.transferableSkills)
      ? (record.transferableSkills as unknown[]).map((s) => validateSkill(s, "transferable")).filter((s): s is Skill => s !== null)
      : [],
    missingSkills: Array.isArray(record.missingSkills)
      ? (record.missingSkills as unknown[]).map((s) => validateSkill(s, "missing")).filter((s): s is Skill => s !== null)
      : [],
    learningRoadmap: Array.isArray(record.learningRoadmap)
      ? (record.learningRoadmap as unknown[]).map(validateRoadmapItem).filter((i): i is RoadmapItem => i !== null)
      : [],
    summary: typeof record.summary === "string" ? record.summary : "",
    interviewTips: Array.isArray(record.interviewTips)
      ? (record.interviewTips as unknown[]).filter((t): t is string => typeof t === "string")
      : [],
    adaptationScore: typeof record.adaptationScore === "number"
      ? Math.min(100, Math.max(0, record.adaptationScore))
      : undefined,
    adaptationSummary: typeof record.adaptationSummary === "string" ? record.adaptationSummary : undefined,
    adaptationHighlights: Array.isArray(record.adaptationHighlights)
      ? (record.adaptationHighlights as unknown[]).map(validateAdaptationHighlight).filter((h): h is AdaptationHighlight => h !== null)
      : undefined,
  }
}

export async function POST(request: NextRequest) {
  const logger = createLogger("skill-map")

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

    const userLogger = createLogger("skill-map", user.id)
    userLogger.requestStart("/api/generate-skill-map")

    const body = await request.json().catch(() => ({}))
    const { rewrittenResumeId } = body

    if (!rewrittenResumeId) {
      userLogger.warn("validation_failed", { reason: "missing_resume_id" })
      return NextResponse.json({ error: "rewrittenResumeId is required" }, { status: 400 })
    }

    // Check if skill map already exists for this resume
    const { data: existingSkillMap } = await supabase
      .from("skill_maps")
      .select("*")
      .eq("rewritten_resume_id", rewrittenResumeId)
      .eq("user_id", user.id)
      .single()

    if (existingSkillMap) {
      userLogger.requestComplete(200, { cached: true })
      return NextResponse.json({
        skillMap: existingSkillMap,
        cached: true,
      })
    }

    // Fetch rewritten resume with job data AND resume_id (link to original)
    const { data: rewrittenResume, error: resumeError } = await supabase
      .from("rewritten_resumes")
      .select(`
        id, user_id, resume_id, structured_data, content, job_posting_id,
        job_posting:job_postings(id, title, company, description, link)
      `)
      .eq("id", rewrittenResumeId)
      .single()

    if (resumeError) {
      userLogger.warn("resume_not_found", { error: resumeError.message })
      return NextResponse.json({ error: "Rewritten resume not found", details: resumeError.message }, { status: 404 })
    }
    if (!rewrittenResume) {
      userLogger.warn("resume_not_found", { rewrittenResumeId })
      return NextResponse.json({ error: "Rewritten resume not found" }, { status: 404 })
    }

    // Extract job posting data
    const jobPosting = rewrittenResume.job_posting as {
      id?: string; title?: string; company?: string; description?: string; link?: string
    } | null;

    if (rewrittenResume.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get job description from job_posting
    let jobDescription = jobPosting?.description || ""
    let jobTitle = jobPosting?.title || ""
    let jobCompany = jobPosting?.company || ""
    const jobLink = jobPosting?.link || ""

    // Fallback: fetch from link if no stored description
    if (!jobDescription && jobLink) {
      try {
        const fetched = await fetchJobPostingFromUrl(jobLink)
        jobDescription = sanitizePlainText(fetched)
      } catch (error) {
        console.error("[SkillMap API] Failed to fetch job from link:", error)
      }
    }

    if (!isMeaningfulText(jobDescription)) {
      userLogger.warn("validation_failed", { reason: "no_job_description" })
      return NextResponse.json(
        { error: "No job description found. Please re-adapt your resume to store job data." },
        { status: 400 }
      )
    }

    // Derive job metadata if needed
    if (!jobTitle || !jobCompany) {
      const derived = deriveJobMetadata(jobDescription, jobLink || "")
      jobTitle = jobTitle || derived.title || "Job Opportunity"
      jobCompany = jobCompany || derived.company || ""
    }

    // Get ORIGINAL resume for gap analysis (this shows real skill gaps)
    let originalResumeText = ""
    let originalResumeId: string | null = null

    if (rewrittenResume.resume_id) {
      const { data: originalResume } = await supabase
        .from("resumes")
        .select("id, extracted_text")
        .eq("id", rewrittenResume.resume_id)
        .single()

      if (originalResume?.extracted_text) {
        originalResumeText = originalResume.extracted_text
        originalResumeId = originalResume.id
      }
    }

    // If no original resume, use adapted one (backwards compatibility)
    if (!originalResumeText) {
      originalResumeText = typeof rewrittenResume.structured_data === "object"
        ? JSON.stringify(rewrittenResume.structured_data, null, 2)
        : rewrittenResume.content || ""
    }

    const adaptedResumeData = typeof rewrittenResume.structured_data === "object"
      ? JSON.stringify(rewrittenResume.structured_data, null, 2)
      : rewrittenResume.content || ""

    // Initialize LLM client with automatic fallback support
    let llmClient
    try {
      llmClient = createLLMClient("[SkillMap]")
    } catch (error) {
      if (error instanceof LLMError && error.type === "API_KEY_MISSING") {
        userLogger.error("api_key_missing")
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
      }
      throw error
    }

    // Helper to call LLM with fallback and parse JSON
    const callLLM = async (prompt: string, analysisType: string): Promise<unknown> => {
      const response = await llmClient.generate(prompt, {
        model: LLM_MODELS.PRIMARY,
        configType: "skillMap",
        enableFallback: true,
        logPrefix: "[SkillMap]"
      })

      userLogger.llmComplete({
        model: response.model,
        usedFallback: response.usedFallback,
        success: true
      })
      userLogger.info("llm_analysis_complete", { analysisType })

      const rawText = response.text
      if (isLikelyRefusalResponse(rawText)) {
        const refusal = new Error(AI_REFUSAL_ERROR) as Error & { code?: string; analysisType?: string }
        refusal.code = "LLM_REFUSAL"
        refusal.analysisType = analysisType
        throw refusal
      }
      const cleanedText = cleanJsonResponse(rawText)
      const parsed = JSON.parse(cleanedText)
      const refusalInfo = getRefusalInfo(parsed)
      if (refusalInfo) {
        const refusal = new Error(refusalInfo.message || AI_REFUSAL_ERROR) as Error & {
          code?: string
          analysisType?: string
          refusalReason?: string
        }
        refusal.code = "LLM_REFUSAL"
        refusal.analysisType = analysisType
        refusal.refusalReason = refusalInfo.refusalReason
        throw refusal
      }
      return parsed
    }

    const isRefusalError = (error: unknown): error is Error & { code?: string; analysisType?: string; refusalReason?: string } => {
      return error instanceof Error && (error as { code?: string }).code === "LLM_REFUSAL"
    }

    // Step 1: Gap Analysis (original resume vs job)
    let gapData: unknown
    try {
      const gapPrompt = buildGapAnalysisPrompt(originalResumeText, jobDescription)
      gapData = await callLLM(gapPrompt, "gap_analysis")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      if (isRefusalError(error)) {
        userLogger.warn("llm_refusal_detected", { analysisType: error.analysisType || "gap_analysis" })
        userLogger.requestComplete(422, { reason: "llm_refusal", analysisType: error.analysisType || "gap_analysis" })
        return NextResponse.json({
          error: error.message || AI_REFUSAL_ERROR,
          blocked: true,
          refusalReason: error.refusalReason || null,
        }, { status: 422 })
      }
      userLogger.llmComplete({
        model: LLM_MODELS.FALLBACK,
        usedFallback: false,
        success: false,
        error: message
      })

      if (error instanceof LLMError && error.type === "RATE_LIMIT") {
        userLogger.requestComplete(429, { reason: "rate_limit" })
        return NextResponse.json({
          error: "AI service is temporarily overloaded. Please try again in a few moments."
        }, { status: 429 })
      }
      userLogger.requestComplete(500, { reason: "gap_analysis_failed" })
      return NextResponse.json({ error: "Failed to analyze skill gap" }, { status: 500 })
    }

    // Step 2: Adaptation Comparison (only if we have original resume)
    let adaptationData: unknown = {}
    if (originalResumeId && originalResumeText !== adaptedResumeData) {
      try {
        const adaptPrompt = buildAdaptationPrompt(originalResumeText, adaptedResumeData, jobDescription)
        adaptationData = await callLLM(adaptPrompt, "adaptation_comparison")
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        if (isRefusalError(error)) {
          userLogger.warn("llm_refusal_detected", { analysisType: error.analysisType || "adaptation_comparison" })
          userLogger.requestComplete(422, { reason: "llm_refusal", analysisType: error.analysisType || "adaptation_comparison" })
          return NextResponse.json({
            error: error.message || AI_REFUSAL_ERROR,
            blocked: true,
            refusalReason: error.refusalReason || null,
          }, { status: 422 })
        }
        userLogger.warn("adaptation_comparison_failed", { error: message })
      }
    }

    // Merge and validate
    const gapObj = (gapData && typeof gapData === "object") ? gapData as Record<string, unknown> : {}
    const adaptObj = (adaptationData && typeof adaptationData === "object") ? adaptationData as Record<string, unknown> : {}
    const combinedData = { ...gapObj, ...adaptObj }
    const parsedData = validateSkillMapData(combinedData)

    // Save to database
    const { data: savedSkillMap, error: saveError } = await supabase
      .from("skill_maps")
      .insert({
        user_id: user.id,
        resume_id: originalResumeId,
        rewritten_resume_id: rewrittenResumeId,
        match_score: parsedData.matchScore,
        adaptation_score: parsedData.adaptationScore || null,
        data: parsedData,
      })
      .select()
      .single()

    if (saveError) {
      userLogger.warn("db_save_failed", { error: saveError.message })
      return NextResponse.json({
        skillMap: {
          id: null,
          data: parsedData,
          match_score: parsedData.matchScore,
          adaptation_score: parsedData.adaptationScore,
          job_title: jobTitle,
          job_company: jobCompany,
        },
        warning: "Skill map generated but could not be saved.",
      })
    }

    // Return with job info for UI compatibility
    const skillMapWithJobInfo = {
      ...savedSkillMap,
      job_title: jobTitle,
      job_company: jobCompany,
    };

    userLogger.requestComplete(200, {
      skillMapId: savedSkillMap.id,
      matchScore: parsedData.matchScore
    })
    return NextResponse.json({ skillMap: skillMapWithJobInfo, cached: false })

  } catch (error) {
    const logger = createLogger("skill-map")
    const err = error instanceof Error ? error : new Error("Unknown error")
    logger.error("unhandled_error", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
