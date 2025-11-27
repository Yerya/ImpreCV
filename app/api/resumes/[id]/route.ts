import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"

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

  if (storagePath) {
    const { error: removeError } = await supabase.storage.from("resumes").remove([storagePath])
    const canIgnore = removeError?.message && removeError.message.toLowerCase().includes("not found")
    if (removeError && !canIgnore) {
      return NextResponse.json({ error: "Failed to delete file." }, { status: 500 })
    }
  }

  const { error: deleteError, status: deleteStatus } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)
    .eq("user_id", user.id)

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message || "Failed to delete resume record." },
      { status: deleteStatus ?? 500 },
    )
  }

  return NextResponse.json({ success: true })
}
