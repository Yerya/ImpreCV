import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRoleKey) {
      return NextResponse.json({ ok: false, message: "Server not configured" }, { status: 500 })
    }

    const adminClient = createClient(url, serviceRoleKey)
    const { error } = await adminClient.auth.admin.deleteUser(user.id)
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ ok: false, message: error?.message || "Failed to delete account" }, { status: 500 })
  }
}


