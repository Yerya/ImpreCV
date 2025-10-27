import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import SettingsClient from "@/components/settings/settings-client"

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile) {
    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
      })
      .select()
      .single()

    if (!error && newProfile) {
      profile = newProfile
    }
  }

  return <SettingsClient user={user} profile={profile} />
}
