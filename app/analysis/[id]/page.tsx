import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import AnalysisClient from "@/components/analysis/analysis-client"

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select(
      `
      *,
      resumes (
        id,
        file_name,
        extracted_text
      ),
      job_postings (
        id,
        title,
        company,
        description
      )
    `,
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !analysis) {
    redirect("/dashboard")
  }

  return <AnalysisClient analysis={analysis} />
}
