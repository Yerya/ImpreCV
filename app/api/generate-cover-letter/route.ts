import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { analysisId } = await request.json()

    // Get analysis data
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .select("*, resumes(*), job_postings(*)")
      .eq("id", analysisId)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    // TODO: Call OpenAI API to generate cover letter
    // For now, create a mock cover letter
    const mockCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${analysis.job_postings.title} position at ${analysis.job_postings.company || "your company"}. With my background and experience, I am confident that I would be a valuable addition to your team.

Throughout my career, I have developed a strong foundation in the skills and technologies mentioned in your job posting. My experience aligns well with your requirements, and I am particularly excited about the opportunity to contribute to your team's success.

In my previous roles, I have consistently demonstrated my ability to deliver high-quality results and collaborate effectively with cross-functional teams. I am passionate about continuous learning and staying current with industry best practices.

I would welcome the opportunity to discuss how my skills and experience can contribute to ${analysis.job_postings.company || "your company"}'s goals. Thank you for considering my application.

Sincerely,
${user.user_metadata?.full_name || "Your Name"}`

    const { data: coverLetterData, error: coverLetterError } = await supabase
      .from("cover_letters")
      .insert({
        analysis_id: analysisId,
        user_id: user.id,
        content: mockCoverLetter,
      })
      .select()
      .single()

    if (coverLetterError) {
      return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 })
    }

    return NextResponse.json({ coverLetterId: coverLetterData.id })
  } catch (error) {
    console.error("Cover letter generation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
