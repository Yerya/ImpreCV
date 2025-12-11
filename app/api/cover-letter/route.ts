import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { DEFAULT_LIST_LIMIT } from "@/lib/constants"

export async function GET(request: NextRequest) {
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
    .from("cover_letters")
    .select(`
      id, content, rewritten_resume_id, created_at, updated_at,
      rewritten_resume:rewritten_resumes(
        job_posting:job_postings(title, company)
      )
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(DEFAULT_LIST_LIMIT)

  if (rewrittenResumeId) {
    query = query.eq("rewritten_resume_id", rewrittenResumeId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Failed to load cover letters:", error)
    return NextResponse.json({ error: "Failed to load cover letters" }, { status: 500 })
  }

  const normalized = (data ?? []).map((item: Record<string, unknown>) => {
    const jobPosting = (item.rewritten_resume as Record<string, unknown>)?.job_posting as Record<string, unknown> | undefined;
    return {
      id: item.id,
      content: item.content,
      jobTitle: jobPosting?.title ?? null,
      jobCompany: jobPosting?.company ?? null,
      rewrittenResumeId: item.rewritten_resume_id ?? null,
      createdAt: item.created_at ?? null,
      updatedAt: item.updated_at ?? null,
    };
  })

  return NextResponse.json({ items: normalized })
}
