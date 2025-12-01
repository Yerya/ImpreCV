import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import CoverLetterClient from "@/components/cover-letter/cover-letter-client"

export default async function CoverLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: coverLetter, error } = await supabase
    .from("cover_letters")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !coverLetter) {
    redirect("/dashboard")
  }

  return <CoverLetterClient coverLetter={coverLetter} user={user} />
}
