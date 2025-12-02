import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 })
    }

    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rewrittenResumeId = searchParams.get("rewrittenResumeId")

    let query = supabase
      .from("skill_maps")
      .select(`
        id, user_id, resume_id, rewritten_resume_id, match_score, 
        adaptation_score, data, created_at, updated_at,
        rewritten_resume:rewritten_resumes(
          job_posting:job_postings(title, company)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (rewrittenResumeId) {
      query = query.eq("rewritten_resume_id", rewrittenResumeId)
    }

    const { data: skillMaps, error } = await query.limit(10)

    if (error) {
      console.error("[SkillMap GET List] Error:", error)
      return NextResponse.json({ error: "Failed to load skill maps" }, { status: 500 })
    }

    // Flatten job info for backward compatibility
    const items = (skillMaps || []).map((sm) => {
      const rewrittenResume = sm.rewritten_resume as { 
        job_posting?: { title?: string; company?: string } | null 
      } | null;
      const jobPosting = rewrittenResume?.job_posting;
      return {
        ...sm,
        job_title: jobPosting?.title || null,
        job_company: jobPosting?.company || null,
      };
    });

    return NextResponse.json({ items })
  } catch (error: any) {
    console.error("[SkillMap GET List] Error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
