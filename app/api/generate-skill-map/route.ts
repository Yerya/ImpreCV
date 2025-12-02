import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { fetchJobPostingFromUrl } from "@/lib/job-posting-server"
import { sanitizePlainText, isMeaningfulText } from "@/lib/text-utils"
import { deriveJobMetadata } from "@/lib/job-posting"
import type { SkillMapData, Skill, RoadmapItem, AdaptationHighlight } from "@/types/skill-map"

const extractText = (response: any): string => {
  try {
    if (typeof response?.text === "function") return response.text()
    if (typeof response?.text === "string") return response.text
    if (response?.candidates?.length) {
      return response.candidates[0]?.content?.parts?.[0]?.text || ""
    }
  } catch (error) {
    console.error("[SkillMap] Failed to extract text:", error)
  }
  return ""
}

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

const validateSkillMapData = (data: any): SkillMapData => {
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

  const validateSkill = (skill: any, category: Skill["category"]): Skill | null => {
    if (!skill || typeof skill.name !== "string") return null
    return {
      name: skill.name,
      priority: ["high", "medium", "low"].includes(skill.priority) ? skill.priority : "medium",
      category,
      resumeEvidence: skill.resumeEvidence || undefined,
      jobRequirement: skill.jobRequirement || undefined,
      matchPercentage: typeof skill.matchPercentage === "number" ? skill.matchPercentage : undefined,
      potentialScoreIncrease: typeof skill.potentialScoreIncrease === "number" ? skill.potentialScoreIncrease : undefined,
    }
  }

  const validateRoadmapItem = (item: any): RoadmapItem | null => {
    if (!item || typeof item.skill !== "string") return null
    return {
      skill: item.skill,
      importance: item.importance || "",
      firstStep: item.firstStep || "",
      potentialScoreIncrease: typeof item.potentialScoreIncrease === "number" ? item.potentialScoreIncrease : 0,
    }
  }

  const validateAdaptationHighlight = (item: any): AdaptationHighlight | null => {
    if (!item || typeof item.skill !== "string") return null
    return {
      skill: item.skill,
      originalPresentation: item.originalPresentation || "",
      adaptedPresentation: item.adaptedPresentation || "",
      improvement: item.improvement || "",
    }
  }

  return {
    matchScore: typeof data.matchScore === "number" ? Math.min(100, Math.max(0, data.matchScore)) : 0,
    matchedSkills: Array.isArray(data.matchedSkills)
      ? data.matchedSkills.map((s: any) => validateSkill(s, "matched")).filter(Boolean)
      : [],
    transferableSkills: Array.isArray(data.transferableSkills)
      ? data.transferableSkills.map((s: any) => validateSkill(s, "transferable")).filter(Boolean)
      : [],
    missingSkills: Array.isArray(data.missingSkills)
      ? data.missingSkills.map((s: any) => validateSkill(s, "missing")).filter(Boolean)
      : [],
    learningRoadmap: Array.isArray(data.learningRoadmap)
      ? data.learningRoadmap.map(validateRoadmapItem).filter(Boolean)
      : [],
    summary: typeof data.summary === "string" ? data.summary : "",
    interviewTips: Array.isArray(data.interviewTips)
      ? data.interviewTips.filter((t: any) => typeof t === "string")
      : [],
    adaptationScore: typeof data.adaptationScore === "number" 
      ? Math.min(100, Math.max(0, data.adaptationScore)) 
      : undefined,
    adaptationSummary: typeof data.adaptationSummary === "string" ? data.adaptationSummary : undefined,
    adaptationHighlights: Array.isArray(data.adaptationHighlights)
      ? data.adaptationHighlights.map(validateAdaptationHighlight).filter(Boolean)
      : undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[SkillMap API] ========== Request received ==========")

    if (!isSupabaseConfigured()) {
      console.error("[SkillMap API] Supabase is not configured")
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 })
    }

    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { rewrittenResumeId } = body

    if (!rewrittenResumeId) {
      console.error("[SkillMap API] Missing rewrittenResumeId")
      return NextResponse.json({ error: "rewrittenResumeId is required" }, { status: 400 })
    }
    console.log("[SkillMap API] Processing rewrittenResumeId:", rewrittenResumeId)

    // Check if skill map already exists for this resume
    const { data: existingSkillMap } = await supabase
      .from("skill_maps")
      .select("*")
      .eq("rewritten_resume_id", rewrittenResumeId)
      .eq("user_id", user.id)
      .single()

    if (existingSkillMap) {
      return NextResponse.json({
        skillMap: existingSkillMap,
        cached: true,
      })
    }

    // Fetch rewritten resume with job data AND resume_id (link to original)
    console.log("[SkillMap API] Fetching rewritten resume...")
    const { data: rewrittenResume, error: resumeError } = await supabase
      .from("rewritten_resumes")
      .select("id, user_id, resume_id, structured_data, content, job_description, job_link, job_title, job_company")
      .eq("id", rewrittenResumeId)
      .single()

    if (resumeError) {
      console.error("[SkillMap API] Supabase error fetching resume:", resumeError)
      return NextResponse.json({ error: "Rewritten resume not found", details: resumeError.message }, { status: 404 })
    }
    if (!rewrittenResume) {
      console.error("[SkillMap API] Resume not found for id:", rewrittenResumeId)
      return NextResponse.json({ error: "Rewritten resume not found" }, { status: 404 })
    }
    console.log("[SkillMap API] Resume found, has job_description:", !!rewrittenResume.job_description)

    if (rewrittenResume.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get job description
    let jobDescription = rewrittenResume.job_description || ""
    let jobTitle = rewrittenResume.job_title || ""
    let jobCompany = rewrittenResume.job_company || ""

    // Fallback: fetch from link if no stored description
    if (!jobDescription && rewrittenResume.job_link) {
      try {
        const fetched = await fetchJobPostingFromUrl(rewrittenResume.job_link)
        jobDescription = sanitizePlainText(fetched)
      } catch (error) {
        console.error("[SkillMap API] Failed to fetch job from link:", error)
      }
    }

    if (!isMeaningfulText(jobDescription)) {
      return NextResponse.json(
        { error: "No job description found. Please re-adapt your resume to store job data." },
        { status: 400 }
      )
    }

    // Derive job metadata if needed
    if (!jobTitle || !jobCompany) {
      const derived = deriveJobMetadata(jobDescription, rewrittenResume.job_link || "")
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
        console.log("[SkillMap API] Found original resume, text length:", originalResumeText.length)
      }
    }

    // If no original resume, use adapted one (backwards compatibility)
    if (!originalResumeText) {
      console.log("[SkillMap API] No original resume, using adapted for analysis")
      originalResumeText = typeof rewrittenResume.structured_data === "object"
        ? JSON.stringify(rewrittenResume.structured_data, null, 2)
        : rewrittenResume.content || ""
    }

    const adaptedResumeData = typeof rewrittenResume.structured_data === "object"
      ? JSON.stringify(rewrittenResume.structured_data, null, 2)
      : rewrittenResume.content || ""

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })

    // Helper to call Gemini and parse JSON
    const callGemini = async (prompt: string): Promise<any> => {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 8192,
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      })
      
      let text = extractText(response).trim()
      if (text.startsWith("```json")) text = text.slice(7)
      else if (text.startsWith("```")) text = text.slice(3)
      if (text.endsWith("```")) text = text.slice(0, -3)
      
      return JSON.parse(text.trim())
    }

    // Step 1: Gap Analysis (original resume vs job)
    console.log("[SkillMap API] Running gap analysis on original resume...")
    let gapData: any
    try {
      const gapPrompt = buildGapAnalysisPrompt(originalResumeText, jobDescription)
      gapData = await callGemini(gapPrompt)
      console.log("[SkillMap API] Gap analysis complete, matchScore:", gapData.matchScore)
    } catch (error: any) {
      console.error("[SkillMap API] Gap analysis failed:", error?.message)
      return NextResponse.json({ error: "Failed to analyze skill gap" }, { status: 500 })
    }

    // Step 2: Adaptation Comparison (only if we have original resume)
    let adaptationData: any = {}
    if (originalResumeId && originalResumeText !== adaptedResumeData) {
      console.log("[SkillMap API] Running adaptation comparison...")
      try {
        const adaptPrompt = buildAdaptationPrompt(originalResumeText, adaptedResumeData, jobDescription)
        adaptationData = await callGemini(adaptPrompt)
        console.log("[SkillMap API] Adaptation analysis complete, score:", adaptationData.adaptationScore)
      } catch (error: any) {
        console.warn("[SkillMap API] Adaptation comparison failed (non-critical):", error?.message)
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
        job_title: jobTitle || null,
        job_company: jobCompany || null,
      })
      .select()
      .single()

    if (saveError) {
      console.error("[SkillMap API] Failed to save:", saveError)
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

    console.log("[SkillMap API] Skill map saved successfully")
    return NextResponse.json({ skillMap: savedSkillMap, cached: false })

  } catch (error: any) {
    console.error("[SkillMap API] Unhandled error:", error?.message, error?.stack)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
