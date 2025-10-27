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

    // TODO: Call OpenAI API to generate rewritten resume
    // For now, create a mock rewritten resume
    const mockRewrittenResume = `# ${user.user_metadata?.full_name || "Your Name"}

## Professional Summary
Experienced professional with a strong background in ${analysis.job_postings.title}. Proven track record of delivering results and exceeding expectations.

## Experience

### Senior Software Engineer | Tech Company
*2020 - Present*
- Led development of key features that improved user engagement by 40%
- Mentored junior developers and established best practices
- Collaborated with cross-functional teams to deliver projects on time

### Software Engineer | Previous Company
*2018 - 2020*
- Developed and maintained web applications using modern technologies
- Implemented automated testing reducing bugs by 30%
- Participated in code reviews and technical discussions

## Skills
JavaScript, React, Node.js, TypeScript, AWS, Docker, Team Leadership, Agile Methodologies

## Education
Bachelor of Science in Computer Science | University Name | 2018`

    const { data: rewriteData, error: rewriteError } = await supabase
      .from("rewritten_resumes")
      .insert({
        analysis_id: analysisId,
        user_id: user.id,
        content: mockRewrittenResume,
        format: "markdown",
      })
      .select()
      .single()

    if (rewriteError) {
      return NextResponse.json({ error: "Failed to generate resume" }, { status: 500 })
    }

    return NextResponse.json({ rewriteId: rewriteData.id })
  } catch (error) {
    console.error("Resume generation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
