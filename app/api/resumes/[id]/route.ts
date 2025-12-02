import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { deleteRecordWithFile } from "@/lib/supabase/transaction"

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 })
  }

  const { id: resumeId } = await context.params
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: resume, error: fetchError, status: fetchStatus } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!resume) {
    const status =
      fetchStatus === 401 || fetchStatus === 403
        ? 401
        : fetchStatus === 406 || fetchStatus === 404
          ? 404
          : fetchStatus ?? 404
    const message = fetchError?.message || "Resume not found."
    return NextResponse.json({ error: message }, { status })
  }

  const storagePath = (() => {
    if (typeof resume.file_url !== "string") return null
    const marker = "/resumes/"
    const idx = resume.file_url.indexOf(marker)
    if (idx === -1) return null
    return resume.file_url.slice(idx + marker.length)
  })()

  // Use transactional pattern: delete record + remove file with proper error handling
  const txResult = await deleteRecordWithFile(supabase, {
    bucket: "resumes",
    filePath: storagePath,
    deleteRecord: async () => {
      return await supabase
        .from("resumes")
        .delete()
        .eq("id", resumeId)
        .eq("user_id", user.id)
    },
  })

  if (!txResult.success) {
    return NextResponse.json(
      { error: txResult.error || "Failed to delete resume." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
