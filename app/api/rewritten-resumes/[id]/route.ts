import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"

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
