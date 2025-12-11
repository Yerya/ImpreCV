import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { parseMarkdownToResumeData } from "@/lib/resume-parser-structured"
import { defaultResumeVariant } from "@/lib/resume-templates/variants"
import type { ResumeData } from "@/lib/resume-templates/types"
import { MAX_ADAPTED_RESUMES, ADAPTED_RESUME_LIMIT_ERROR, MAX_CONTENT_LENGTH } from "@/lib/constants"

export const runtime = "nodejs"

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 })
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("rewritten_resumes")
    .select(`
      id, content, structured_data, resume_id, created_at, updated_at, 
      pdf_url, pdf_path, variant, theme, file_name, job_posting_id,
      job_posting:job_postings(id, title, company)
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(MAX_ADAPTED_RESUMES)

  if (error) {
    return NextResponse.json({ error: "Failed to load saved resumes." }, { status: 500 })
  }

  // Flatten job_posting data for backward compatibility
  const items = (data || []).map((item) => {
    const jobPosting = item.job_posting as { title?: string; company?: string } | null;
    return {
      ...item,
      job_title: jobPosting?.title || null,
      job_company: jobPosting?.company || null,
    };
  });

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 })
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const rawContent = typeof body?.content === "string" ? body.content : ""
  const structuredData = (body?.structuredData || body?.structured_data) as ResumeData | undefined
  const resumeId = typeof body?.resumeId === "string" ? body.resumeId : null
  const variant = typeof body?.variant === "string" ? body.variant : defaultResumeVariant
  const theme = body?.theme === "dark" ? "dark" : "light"

  const parsedData = structuredData ?? parseMarkdownToResumeData(rawContent)
  const content = JSON.stringify(parsedData)

  if (!parsedData || !content) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 })
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: "Content is too long." }, { status: 400 })
  }

  // If identical content already saved for this user, return it instead of creating a duplicate
  const { data: existing, error: existingError } = await supabase
    .from("rewritten_resumes")
    .select(`
      id, content, structured_data, resume_id, created_at, updated_at, 
      pdf_url, pdf_path, variant, theme, file_name, job_posting_id,
      job_posting:job_postings(id, title, company)
    `)
    .eq("user_id", user.id)
    .eq("content", content)
    .limit(1)
    .maybeSingle()

  if (existing && !existingError) {
    const jobPosting = existing.job_posting as { title?: string; company?: string } | null;
    const item = {
      ...existing,
      job_title: jobPosting?.title || null,
      job_company: jobPosting?.company || null,
    };
    return NextResponse.json({ item })
  }

  const { count, error: countError } = await supabase.from("rewritten_resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id)

  if (countError) {
    return NextResponse.json({ error: "Failed to check saved resumes." }, { status: 500 })
  }

  if ((count ?? 0) >= MAX_ADAPTED_RESUMES) {
    return NextResponse.json({ error: ADAPTED_RESUME_LIMIT_ERROR }, { status: 400 })
  }

  const { data, error: insertError } = await supabase
    .from("rewritten_resumes")
    .insert({
      user_id: user.id,
      content,
      structured_data: parsedData,
      resume_id: resumeId,
      format: "json",
      variant,
      theme,
      file_name: parsedData.personalInfo.name || "resume",
    })
    .select(`
      id, content, structured_data, resume_id, created_at, updated_at, 
      pdf_url, pdf_path, variant, theme, file_name, job_posting_id
    `)
    .single()

  if (insertError) {
    return NextResponse.json({ error: "Failed to save adapted resume." }, { status: 500 })
  }

  // Return with null job data (this endpoint doesn't handle job posting creation)
  const item = {
    ...data,
    job_title: null,
    job_company: null,
  };

  return NextResponse.json({ item })
}
