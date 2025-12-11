import { redirect } from "next/navigation"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import DashboardClient from "@/components/dashboard/dashboard-client"
import { SupabaseBanner } from "@/components/supabase-banner"

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SupabaseBanner />
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-4 text-muted-foreground">
            Please connect Supabase integration to access the dashboard and start analyzing your resume.
          </p>
        </div>
      </div>
    )
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user's resumes
  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch recent skill maps
  const { data: rawSkillMaps } = await supabase
    .from("skill_maps")
    .select(`
      id, match_score, adaptation_score, created_at,
      rewritten_resume:rewritten_resumes(
        job_posting:job_postings(title, company)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Flatten job info for components
  const skillMaps = (rawSkillMaps || []).map((sm: Record<string, unknown>) => ({
    ...sm,
    job_title: sm.rewritten_resume?.job_posting?.title || null,
    job_company: sm.rewritten_resume?.job_posting?.company || null,
  }))

  // Fetch adapted resumes count to check limit
  const { count: adaptedResumesCount } = await supabase
    .from("rewritten_resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  return (
    <DashboardClient
      user={user}
      resumes={resumes || []}
      recentSkillMaps={skillMaps || []}
      adaptedResumesCount={adaptedResumesCount || 0}
    />
  )
}
