import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { parseMarkdownToResumeData } from "@/lib/resume-parser-structured"
import type { ResumeData } from "@/lib/resume-templates/types"
import { MAX_CONTENT_LENGTH } from "@/lib/constants"

export const runtime = "nodejs"

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params

  const { data, error } = await supabase
    .from("rewritten_resumes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single()

  if (error) {
    if (error.code === "PGRST116" || error.code === "P0002") {
      return NextResponse.json({ error: "Adapted resume not found." }, { status: 404 })
    }
    if (error.code === "42501") {
      return NextResponse.json({ error: "Not allowed to delete this adapted resume." }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed to delete adapted resume." }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Adapted resume not found." }, { status: 404 })
  }

  return NextResponse.json({ success: true, id: data.id })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  // Handle structured data / content only if provided
  const rawContent = typeof body?.content === "string" ? body.content : null
  const structuredData = (body?.structuredData || body?.structured_data) as ResumeData | undefined
  
  if (structuredData || rawContent) {
    const parsedData = structuredData ?? parseMarkdownToResumeData(rawContent || "")
    const content = JSON.stringify(parsedData)
    
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: "Content is too long." }, { status: 400 })
    }
    
    updateData.content = content
    updateData.structured_data = parsedData
    
    // Only update fileName if content is being updated
    if (typeof body?.fileName === "string" && body.fileName.trim()) {
      updateData.file_name = body.fileName.trim()
    } else if (parsedData.personalInfo.name) {
      updateData.file_name = parsedData.personalInfo.name
    }
  }

  // Handle optional fields
  if (typeof body?.variant === "string") {
    updateData.variant = body.variant
  }
  if (body?.theme === "dark" || body?.theme === "light") {
    updateData.theme = body.theme
  }
  if (typeof body?.pdfUrl === "string") {
    updateData.pdf_url = body.pdfUrl
  }
  if (typeof body?.pdfPath === "string") {
    updateData.pdf_path = body.pdfPath
  }

  const { data, error } = await supabase
    .from("rewritten_resumes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(`
      id, content, structured_data, resume_id, variant, theme, mode, name,
      pdf_url, pdf_path, created_at, updated_at, file_name, job_posting_id,
      job_posting:job_postings(id, title, company)
    `)
    .single()

  if (error) {
    if (error.code === "PGRST116" || error.code === "P0002") {
      return NextResponse.json({ error: "Adapted resume not found." }, { status: 404 })
    }
    if (error.code === "42501") {
      return NextResponse.json({ error: "Not allowed to update this adapted resume." }, { status: 403 })
    }
    return NextResponse.json({ error: "Failed to update adapted resume." }, { status: 500 })
  }

  // Flatten job_posting for backward compatibility
  const jobPosting = data.job_posting as { title?: string; company?: string } | null;
  const item = {
    ...data,
    job_title: jobPosting?.title || null,
    job_company: jobPosting?.company || null,
  };

  return NextResponse.json({ item })
}
