import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { deriveJobMetadata, fetchJobPostingFromUrl, normalizeJobLink } from "@/lib/job-posting"
import { sanitizePlainText } from "@/lib/text-utils"

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resumeId, jobPosting } = await request.json()

    // Get resume data
    const { data: resume, error: resumeError } = await supabase.from("resumes").select("*").eq("id", resumeId).single()

    if (resumeError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    let jobDescription = jobPosting.description || ""

    const normalizedLink = normalizeJobLink(jobPosting.jobLink)

    if (jobPosting.inputType === "link" && normalizedLink) {
      console.log("Fetching job posting from URL:", normalizedLink)
      try {
        jobDescription = await fetchJobPostingFromUrl(normalizedLink)
        console.log("Successfully fetched job posting, length:", jobDescription.length)
      } catch (error) {
        console.error("Failed to fetch job posting:", error)
        return NextResponse.json(
          {
            error: "Failed to fetch job posting from the provided link. Please try pasting the description instead.",
          },
          { status: 400 },
        )
      }
    }

    const cleanedDescription = sanitizePlainText(jobDescription)
    const metadataSource = cleanedDescription || jobDescription || normalizedLink || ""
    const { title, company } = jobPosting.metadata?.title
      ? { title: jobPosting.metadata.title, company: jobPosting.metadata.company }
      : deriveJobMetadata(metadataSource, normalizedLink)
    const storedDescription = cleanedDescription || jobDescription
    const storedTitle = title || "Job Opportunity"

    if (!storedDescription.trim()) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 })
    }

    // Create job posting
    const { data: jobPostingData, error: jobPostingError } = await supabase
      .from("job_postings")
      .insert({
        user_id: user.id,
        title: storedTitle,
        company: company || null,
        description: storedDescription,
      })
      .select()
      .single()

    if (jobPostingError) {
      return NextResponse.json({ error: "Failed to save job posting" }, { status: 500 })
    }

    // TODO: Call OpenAI API for analysis
    // For now, create a mock analysis
    const mockAnalysis = {
      user_id: user.id,
      resume_id: resumeId,
      job_posting_id: jobPostingData.id,
      match_score: Math.floor(Math.random() * 30) + 70, // 70-100
      strengths: [
        "Strong technical background matching job requirements",
        "Relevant experience in similar roles",
        "Demonstrated leadership skills",
      ],
      gaps: [
        "Missing specific certification mentioned in job posting",
        "Limited experience with mentioned technology stack",
      ],
      recommendations: [
        "Highlight your project management experience more prominently",
        "Add specific metrics to quantify your achievements",
        "Include keywords from the job description",
      ],
      keyword_analysis: {
        matched: ["JavaScript", "React", "Node.js", "Team Leadership"],
        missing: ["TypeScript", "AWS", "Docker"],
      },
    }

    const { data: analysisData, error: analysisError } = await supabase
      .from("analyses")
      .insert(mockAnalysis)
      .select()
      .single()

    if (analysisError) {
      return NextResponse.json({ error: "Failed to create analysis" }, { status: 500 })
    }

    return NextResponse.json({ analysisId: analysisData.id })
  } catch (error) {
    console.error("Analysis API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
