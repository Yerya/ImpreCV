import { NextResponse, type NextRequest } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { deriveJobMetadata, normalizeJobLink } from "@/lib/job-posting"
import { fetchJobPostingFromUrl } from "@/lib/job-posting-server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { isMeaningfulText, sanitizePlainText } from "@/lib/text-utils"

const MAX_LENGTH = 50000

const extractText = (response: any) => {
  try {
    console.log("[extractText] Full response structure:", JSON.stringify(response, null, 2))
    console.log("[extractText] Response type:", typeof response)
    console.log("[extractText] Response.text type:", typeof response?.text)
    console.log("[extractText] Response.candidates:", response?.candidates)

    // Try method 1: response.text() function
    if (typeof response?.text === "function") {
      const text = response.text()
      console.log("[extractText] Method 1 (text function) returned:", text?.substring(0, 100))
      return text
    }

    // Try method 2: response.text string
    if (typeof response?.text === "string") {
      console.log("[extractText] Method 2 (text string) returned:", response.text.substring(0, 100))
      return response.text
    }

    // Try method 3: candidates array
    if (response?.candidates?.length) {
      const text = response.candidates[0]?.content?.parts?.[0]?.text || ""
      console.log("[extractText] Method 3 (candidates) returned:", text.substring(0, 100))
      return text
    }

    console.error("[extractText] No extraction method succeeded")
  } catch (error) {
    console.error("[extractText] Failed to extract text from Gemini response:", error)
  }
  return ""
}

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
- Keep it under 260 words, ready to paste into an email. Return plain text only.`
}

export async function POST(request: NextRequest) {
  try {
    console.log("[Cover Letter API] Request received")

    if (!isSupabaseConfigured()) {
      console.error("[Cover Letter API] Supabase not configured")
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 })
    }

    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[Cover Letter API] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Cover Letter API] User authenticated:", user.id)

    const body = await request.json().catch(() => ({}))
    const { rewrittenResumeId, jobDescription, jobLink } = body || {}

    if (!rewrittenResumeId) {
      return NextResponse.json({ error: "rewrittenResumeId is required" }, { status: 400 })
    }

    // Fetch rewritten resume
    const { data: rewrittenResume, error: resumeError } = await supabase
      .from("rewritten_resumes")
      .select("id, user_id, structured_data, content, analysis_id, file_name")
      .eq("id", rewrittenResumeId)
      .single()

    if (resumeError || !rewrittenResume) {
      return NextResponse.json({ error: "Rewritten resume not found" }, { status: 404 })
    }

    if (rewrittenResume.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const normalizedLink = typeof jobLink === "string" ? normalizeJobLink(jobLink) : ""
    let cleanedResume = ""
    let cleanedJobDescription = ""
    let jobTitle = ""
    let jobCompany: string | undefined
    let derivedFromAnalysis = false

    // Use adapted resume content
    cleanedResume = sanitizePlainText(
      typeof rewrittenResume.structured_data === "object"
        ? JSON.stringify(rewrittenResume.structured_data)
        : rewrittenResume.content || ""
    )

    cleanedJobDescription = sanitizePlainText(jobDescription || "")

    if (!cleanedJobDescription && normalizedLink) {
      try {
        const fetched = await fetchJobPostingFromUrl(normalizedLink)
        cleanedJobDescription = sanitizePlainText(fetched)
      } catch (error) {
        console.error("Failed to fetch job posting for cover letter:", error)
        return NextResponse.json(
          { error: "Failed to fetch job posting from the provided link. Please try pasting the description." },
          { status: 400 },
        )
      }
    }

    // Try to reuse job description from linked analysis if nothing provided
    if (!cleanedJobDescription && rewrittenResume.analysis_id) {
      const { data: analysis } = await supabase
        .from("analyses")
        .select("job_posting_id, job_postings(description, title, company)")
        .eq("id", rewrittenResume.analysis_id)
        .eq("user_id", user.id)
        .single()

      const descriptionFromAnalysis = analysis?.job_postings?.description
      if (descriptionFromAnalysis) {
        cleanedJobDescription = sanitizePlainText(descriptionFromAnalysis)
        jobTitle = analysis.job_postings?.title || jobTitle
        jobCompany = analysis.job_postings?.company || jobCompany
        derivedFromAnalysis = true
      }
    }

    console.log("[Cover Letter API] Cleaned data:", {
      resumeLength: cleanedResume.length,
      jobDescriptionLength: cleanedJobDescription.length,
      rewrittenResumeId,
    })

    if (!isMeaningfulText(cleanedJobDescription)) {
      return NextResponse.json(
        {
          error: derivedFromAnalysis
            ? "Job description is missing for this tailored resume. Please re-run the analysis to regenerate a cover letter."
            : "Please provide a job description or link to generate a cover letter.",
        },
        { status: 400 },
      )
    }

    const looksValid = isMeaningfulText(cleanedResume) && isMeaningfulText(cleanedJobDescription)
    if (!looksValid) {
      console.error("[Cover Letter API] Invalid text - Resume valid:", isMeaningfulText(cleanedResume), "Job valid:", isMeaningfulText(cleanedJobDescription))
      return NextResponse.json(
        {
          error: "The provided text is not a valid resume or job description. Please upload your resume and vacancy details.",
        },
        { status: 400 },
      )
    }

    if (cleanedResume.length > MAX_LENGTH) {
      return NextResponse.json({ error: "Resume text is too long" }, { status: 400 })
    }
    if (cleanedJobDescription.length > MAX_LENGTH) {
      return NextResponse.json({ error: "Job description is too long" }, { status: 400 })
    }

    const derivedMeta = deriveJobMetadata(cleanedJobDescription, normalizedLink)
    if (!jobTitle) {
      jobTitle = derivedMeta.title || "Job Opportunity"
    }
    if (!jobCompany) {
      jobCompany = derivedMeta.company || undefined
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[Cover Letter API] GEMINI_API_KEY is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    console.log("[Cover Letter API] Gemini API key found, initializing AI")
    const ai = new GoogleGenAI({ apiKey })

    const prompt = buildPrompt({
      resume: cleanedResume,
      job: cleanedJobDescription,
      role: jobTitle || "Target Role",
      company: jobCompany || undefined,
    })

    console.log("[Cover Letter API] Calling Gemini API with model: gemini-2.5-flash")
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 4096,
        temperature: 0.45,
        responseMimeType: "text/plain",
      },
    })

    console.log("[Cover Letter API] Gemini response received, extracting text")
    const content = extractText(response).trim()
    console.log("[Cover Letter API] Extracted content length:", content.length)

    if (!content) {
      console.error("[Cover Letter API] No content extracted from Gemini response")
      return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 })
    }

    let coverLetterId: string | null = null
    let warning: string | null = null

    // Save cover letter with new simplified structure
    const { data: coverLetter, error: coverLetterError } = await supabase
      .from("cover_letters")
      .insert({
        user_id: user.id,
        content,
        job_title: jobTitle || null,
        job_company: jobCompany || null,
        rewritten_resume_id: rewrittenResumeId,
      })
      .select("id")
      .single()

    if (coverLetterError || !coverLetter) {
      console.error("Failed to save cover letter:", coverLetterError)
      warning = "Cover letter generated but could not be saved. Copy it now."
    } else {
      coverLetterId = coverLetter.id
    }

    console.log("[Cover Letter API] Success - returning response with coverLetterId:", coverLetterId)
    return NextResponse.json({
      coverLetterId,
      content,
      warning,
      metadata: { title: jobTitle, company: jobCompany },
    })
  } catch (error: any) {
    console.error("Cover letter generation API error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
