import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { parseMarkdownToResumeData } from "@/lib/resume-parser-structured"
import { defaultResumeVariant } from "@/lib/resume-templates/variants"
import type { ResumeData } from "@/lib/resume-templates/types"

export const runtime = "nodejs"
const MAX_LENGTH = 50000

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

  const rawContent = typeof body?.content === "string" ? body.content : ""
  const structuredData = (body?.structuredData || body?.structured_data) as ResumeData | undefined
  const variant = typeof body?.variant === "string" ? body.variant : defaultResumeVariant
  const theme = body?.theme === "dark" ? "dark" : "light"
  const pdfUrl = typeof body?.pdfUrl === "string" ? body.pdfUrl : null
  const pdfPath = typeof body?.pdfPath === "string" ? body.pdfPath : null
  const parsedData = structuredData ?? parseMarkdownToResumeData(rawContent)
  const content = JSON.stringify(parsedData)
  const fileName = typeof body?.fileName === "string" && body.fileName.trim() ? body.fileName.trim() : parsedData.personalInfo.name || "resume"

  if (content.length > MAX_LENGTH) {
    return NextResponse.json({ error: "Content is too long." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("rewritten_resumes")
    .update({
      content,
      structured_data: parsedData,
      variant,
      theme,
      pdf_url: pdfUrl,
      pdf_path: pdfPath,
      file_name: fileName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, content, structured_data, resume_id, variant, theme, pdf_url, pdf_path, created_at, updated_at, file_name, job_title, job_company")
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

  return NextResponse.json({ item: data })
}
