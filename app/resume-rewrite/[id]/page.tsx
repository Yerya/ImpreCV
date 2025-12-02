import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import ResumeRewriteClient from "@/components/resume-rewrite/resume-rewrite-client"

export default async function ResumeRewritePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: rewrittenResume, error } = await supabase
    .from("rewritten_resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !rewrittenResume) {
    redirect("/dashboard")
  }

  return <ResumeRewriteClient rewrittenResume={rewrittenResume} user={user} />
}
