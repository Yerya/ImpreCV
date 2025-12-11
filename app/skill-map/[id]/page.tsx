import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import SkillMapClient from "@/components/skill-map/skill-map-client"

export const dynamic = 'force-dynamic'

export default async function SkillMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: skillMap, error } = await supabase
    .from("skill_maps")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !skillMap) {
    redirect("/resume-editor")
  }

  return <SkillMapClient skillMap={skillMap} user={user} />
}
