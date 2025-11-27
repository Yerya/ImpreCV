import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { extractAndSanitizeResume, MAX_FILE_SIZE_BYTES, resolveResumeFileType } from "@/lib/resume-parser"
import { isMeaningfulText } from "@/lib/text-utils"

export const runtime = "nodejs"
const MAX_RESUMES_PER_USER = 3

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_") || "resume"
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

  const { count: resumeCount, error: countError } = await supabase
    .from("resumes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (countError) {
    return NextResponse.json({ error: "Failed to verify resume limit." }, { status: 500 })
  }

  if ((resumeCount ?? 0) >= MAX_RESUMES_PER_USER) {
    return NextResponse.json({ error: "You can upload up to 3 resumes." }, { status: 400 })
  }

  const formData = await req.formData().catch(() => null)

  if (!formData) {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 })
  }

  const file = formData.get("file")
  const providedName = formData.get("fileName")

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 })
  }

  const originalName =
    typeof providedName === "string" && providedName.trim()
      ? providedName.trim()
      : (file as File).name || "resume"

  const mimeType = (file as File).type || ""
  const fileSize = (file as File).size || 0

  if (!fileSize) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 })
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    const maxFileSizeMb = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)
    return NextResponse.json({ error: `File is too large. Max ${maxFileSizeMb}MB.` }, { status: 400 })
  }

  const detectedType = resolveResumeFileType(mimeType, originalName)
  if (!detectedType) {
    return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let extractedText = ""
  try {
    extractedText = await extractAndSanitizeResume(buffer, { mimeType, fileName: originalName })
  } catch (error: any) {
    const reason = error?.message || error
    return NextResponse.json(
      {
        error:
          reason ||
          "Failed to extract text from the uploaded file. Please upload a text-based PDF, DOCX, or TXT.",
      },
      { status: 500 },
    )
  }

  if (!isMeaningfulText(extractedText)) {
    return NextResponse.json(
      { error: "Could not extract readable text. Please upload a text-based PDF, DOCX, or TXT file." },
      { status: 400 },
    )
  }

  const filePath = `${user.id}/${Date.now()}-${safeName(originalName)}`
  const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, buffer, {
    contentType: mimeType || undefined,
  })

  if (uploadError) {
    return NextResponse.json({ error: "Failed to store file." }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("resumes").getPublicUrl(filePath)

  const { data: resume, error: dbError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      file_name: originalName,
      file_url: publicUrl,
      file_size: fileSize,
      extracted_text: extractedText,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from("resumes").remove([filePath])
    if (dbError.code === "23505") {
      return NextResponse.json(
        { error: "You already uploaded a resume with this name. Rename the file and try again." },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: "Failed to save resume metadata." }, { status: 500 })
  }

  return NextResponse.json({
    resume,
    preview: extractedText.slice(0, 1200),
    textLength: extractedText.length,
  })
}
