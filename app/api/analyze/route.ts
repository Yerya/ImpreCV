import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

async function fetchJobPostingFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const html = await response.text()

    // Basic HTML parsing - extract text content
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, " ")

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, " ")
    text = text.replace(/&amp;/g, "&")
    text = text.replace(/&lt;/g, "<")
    text = text.replace(/&gt;/g, ">")
    text = text.replace(/&quot;/g, '"')

    // Clean up whitespace
    text = text.replace(/\s+/g, " ").trim()

    // Limit to reasonable length (first 10000 chars)
    return text.substring(0, 10000)
  } catch (error) {
    console.error("Error fetching job posting:", error)
    throw new Error("Failed to fetch job posting from URL")
  }
}

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

    let jobDescription = jobPosting.description

    if (jobPosting.inputType === "link" && jobPosting.jobLink) {
      console.log("Fetching job posting from URL:", jobPosting.jobLink)
      try {
        jobDescription = await fetchJobPostingFromUrl(jobPosting.jobLink)
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

    // Create job posting
    const { data: jobPostingData, error: jobPostingError } = await supabase
      .from("job_postings")
      .insert({
        user_id: user.id,
        title: jobPosting.title,
        company: jobPosting.company,
        description: jobDescription,
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
