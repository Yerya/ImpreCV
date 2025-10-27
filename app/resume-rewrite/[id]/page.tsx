import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import ResumeRewriteClient from "@/components/resume-rewrite/resume-rewrite-client"

export default async function ResumeRewritePage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: rewrittenResume, error } = await supabase
    .from("rewritten_resumes")
    .select(
      `
      *,
      analyses (
        id,
        match_score,
        job_postings (
          title,
          company
        )
      )
    `,
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !rewrittenResume) {
    redirect("/dashboard")
  }

  return <ResumeRewriteClient rewrittenResume={rewrittenResume} user={user} />
}
