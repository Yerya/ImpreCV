import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"

const DEFAULT_LIMIT = 10

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
    .select("id, content, job_title, job_company, rewritten_resume_id, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(DEFAULT_LIMIT)

  if (rewrittenResumeId) {
    query = query.eq("rewritten_resume_id", rewrittenResumeId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Failed to load cover letters:", error)
    return NextResponse.json({ error: "Failed to load cover letters" }, { status: 500 })
  }

  const normalized = (data ?? []).map((item: any) => ({
    id: item.id,
    content: item.content,
    jobTitle: item.job_title ?? null,
    jobCompany: item.job_company ?? null,
    rewrittenResumeId: item.rewritten_resume_id ?? null,
    createdAt: item.created_at ?? null,
    updatedAt: item.updated_at ?? null,
  }))

  return NextResponse.json({ items: normalized })
}
