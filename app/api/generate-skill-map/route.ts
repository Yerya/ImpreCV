import { NextRequest, NextResponse } from "next/server"
import type { SkillMapData, Skill, RoadmapItem, AdaptationHighlight } from "@/types/skill-map"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { fetchJobPostingFromUrl } from "@/lib/job-posting-server"
import { sanitizePlainText, isMeaningfulText } from "@/lib/text-utils"
import { deriveJobMetadata } from "@/lib/job-posting"
import { createLLMClient, LLMError, LLM_MODELS, cleanJsonResponse } from "@/lib/api/llm"
import { createLogger } from "@/lib/api/logger"
import type { SkillMapData, Skill, RoadmapItem, AdaptationHighlight } from "@/types/skill-map"

// Prompt for analyzing ORIGINAL resume vs job description (skill gap analysis)
const buildGapAnalysisPrompt = (originalResumeText: string, jobDescription: string) => {
  return `Analyze candidate's ORIGINAL resume against job requirements. Return JSON only.

ORIGINAL RESUME:
${originalResumeText}

JOB DESCRIPTION:
${jobDescription}

Return this JSON structure:
{
  "matchScore": <0-100 based on original resume fit>,
  "summary": "<2 sentences about candidate's current fit>",
  "matchedSkills": [{"name": "<skill>", "priority": "high|medium|low", "category": "matched", "resumeEvidence": "<quote>", "jobRequirement": "<text>", "matchPercentage": 100}],
  "transferableSkills": [{"name": "<skill>", "priority": "high|medium|low", "category": "transferable", "resumeEvidence": "<quote>", "jobRequirement": "<text>", "matchPercentage": 60}],
  "missingSkills": [{"name": "<skill>", "priority": "high|medium|low", "category": "missing", "jobRequirement": "<text>", "potentialScoreIncrease": 5}],
  "learningRoadmap": [{"skill": "<missing skill>", "importance": "<why needed>", "firstStep": "<concrete action>", "potentialScoreIncrease": 5}],
  "interviewTips": ["<tip1>", "<tip2>", "<tip3>"]
}

Rules:
- matched: skills clearly in BOTH resume and job
- transferable: related/adjacent skills from resume
- missing: job requirements NOT in resume (focus for learning)
- priority: high=must-have, medium=nice-to-have, low=bonus
- learningRoadmap: only for missing high-priority skills
- Be honest about gaps - this helps candidate prepare
`
}

// Prompt for comparing original vs adapted resume (adaptation quality)
const buildAdaptationPrompt = (
  originalResumeText: string, 
  adaptedResumeData: string, 
  jobDescription: string
) => {
  return `Compare how the ADAPTED resume better presents skills for this job. Return JSON only.

ORIGINAL RESUME:
${originalResumeText}

ADAPTED RESUME:
${adaptedResumeData}

JOB DESCRIPTION:
${jobDescription}

Return this JSON structure:
{
  "adaptationScore": <0-100 how well adapted version presents relevant skills>,
  "adaptationSummary": "<2 sentences about improvement>",
  "adaptationHighlights": [
    {
      "skill": "<skill name>",
      "originalPresentation": "<how it appeared in original>",
      "adaptedPresentation": "<how it's now presented>",
      "improvement": "<what's better>"
    }
  ]
}

Focus on:
- How skills are now better aligned with job keywords
- How experience is reframed to match requirements
- What relevant details were emphasized
- Keep descriptions concise (under 30 words each)
`
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
  const dataObj = data as Record<string, unknown>

  const validateSkill = (skill: unknown, category: Skill["category"]): Skill | null => {
    if (!skill || typeof skill !== "object") return null
    const skillObj = skill as Record<string, unknown>
    if (typeof skillObj.name !== "string") return null
    return {
      name: skillObj.name,
      priority: ["high", "medium", "low"].includes(skillObj.priority as string) ? (skillObj.priority as "high" | "medium" | "low") : "medium",
      category,
      resumeEvidence: skillObj.resumeEvidence as string | undefined || undefined,
      jobRequirement: skillObj.jobRequirement as string | undefined || undefined,
      matchPercentage: typeof skillObj.matchPercentage === "number" ? skillObj.matchPercentage : undefined,
      potentialScoreIncrease: typeof skillObj.potentialScoreIncrease === "number" ? skillObj.potentialScoreIncrease : undefined,
    }
  }

  const validateRoadmapItem = (item: unknown): RoadmapItem | null => {
    if (!item || typeof item !== "object") return null
    const itemObj = item as Record<string, unknown>
    if (typeof itemObj.skill !== "string") return null
    return {
      skill: itemObj.skill,
      importance: (itemObj.importance as string) || "",
      firstStep: (itemObj.firstStep as string) || "",
      potentialScoreIncrease: typeof itemObj.potentialScoreIncrease === "number" ? itemObj.potentialScoreIncrease : 0,
    }
  }

  const validateAdaptationHighlight = (item: unknown): AdaptationHighlight | null => {
    if (!item || typeof item !== "object") return null
    const itemObj = item as Record<string, unknown>
    if (typeof itemObj.skill !== "string") return null
    return {
      skill: itemObj.skill,
      originalPresentation: (itemObj.originalPresentation as string) || "",
      adaptedPresentation: (itemObj.adaptedPresentation as string) || "",
      improvement: (itemObj.improvement as string) || "",
    }
  }

  return {
    matchScore: typeof dataObj.matchScore === "number" ? Math.min(100, Math.max(0, dataObj.matchScore)) : 0,
    matchedSkills: Array.isArray(dataObj.matchedSkills)
      ? dataObj.matchedSkills.map((s: unknown) => validateSkill(s, "matched")).filter(Boolean)
      : [],
    transferableSkills: Array.isArray(dataObj.transferableSkills)
      ? dataObj.transferableSkills.map((s: unknown) => validateSkill(s, "transferable")).filter(Boolean)
      : [],
    missingSkills: Array.isArray(dataObj.missingSkills)
      ? dataObj.missingSkills.map((s: unknown) => validateSkill(s, "missing")).filter(Boolean)
      : [],
    learningRoadmap: Array.isArray(dataObj.learningRoadmap)
      ? dataObj.learningRoadmap.map(validateRoadmapItem).filter(Boolean)
      : [],
    summary: typeof dataObj.summary === "string" ? dataObj.summary : "",
    interviewTips: Array.isArray(dataObj.interviewTips)
      ? dataObj.interviewTips.filter((t: unknown) => typeof t === "string")
      : [],
    adaptationScore: typeof dataObj.adaptationScore === "number" 
      ? Math.min(100, Math.max(0, dataObj.adaptationScore)) 
      : undefined,
    adaptationSummary: typeof dataObj.adaptationSummary === "string" ? dataObj.adaptationSummary : undefined,
    adaptationHighlights: Array.isArray(dataObj.adaptationHighlights)
      ? dataObj.adaptationHighlights.map(validateAdaptationHighlight).filter(Boolean)
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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.warn("unauthorized_request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        model: LLM_MODELS.FALLBACK, // Use 2.0-flash for skill-map (more stable for analysis)
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
      
      const cleanedText = cleanJsonResponse(response.text)
      return JSON.parse(cleanedText)
    }

    // Step 1: Gap Analysis (original resume vs job)
    let gapData: unknown
    try {
      const gapPrompt = buildGapAnalysisPrompt(originalResumeText, jobDescription)
      gapData = await callLLM(gapPrompt, "gap_analysis")
    } catch (error: unknown) {
      const err = error as Error
      userLogger.llmComplete({
        model: LLM_MODELS.FALLBACK,
        usedFallback: false,
        success: false,
        error: err?.message
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
      } catch (error: unknown) {
        const err = error as Error
        userLogger.warn("adaptation_comparison_failed", { error: err?.message })
      }
    }

    // Merge and validate
    const combinedData = { ...gapData, ...adaptationData }
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

  } catch (error: unknown) {
    const logger = createLogger("skill-map")
    const err = error as Error
    logger.error("unhandled_error", error instanceof Error ? error : new Error(err?.message || "Unknown error"))
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
