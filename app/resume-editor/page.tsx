import { redirect } from "next/navigation"
import { ResumeEditor, type SavedResume } from "@/components/resume-editor"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { parseMarkdownToResumeData } from "@/lib/resume-parser-structured"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { defaultResumeVariant } from "@/lib/resume-templates/variants"
import type { ResumeData } from "@/lib/resume-templates/types"
import { SupabaseBanner } from "@/components/supabase-banner"
import { GlobalHeader } from "@/components/global-header"

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams?: Promise<{ id?: string }> | { id?: string }
}

const mapRowToResume = (row: Record<string, unknown>): SavedResume => {
    const data = (row?.structured_data as ResumeData) || parseMarkdownToResumeData((row?.content as string) || "")

    return {
        id: (row?.id as string) || null,
        data,
        variant: (row?.variant as SavedResume['variant']) || defaultResumeVariant,
        theme: row?.theme === 'dark' ? 'dark' : 'light',
        mode: (row?.mode as SavedResume['mode']) || null,
        pdfUrl: (row?.pdf_url as string) || null,
        createdAt: (row?.created_at as string) || null,
        updatedAt: (row?.updated_at as string) || null,
        fileName: (row?.file_name as string) || data?.personalInfo?.name || "resume",
        atsScoreBefore: typeof row?.ats_score_before === 'number' ? row.ats_score_before : null,
        atsScoreAfter: typeof row?.ats_score_after === 'number' ? row.ats_score_after : null,
    }
}

export default async function ResumeEditorPage({ searchParams }: PageProps) {
    if (!isSupabaseConfigured()) {
        return (
            <div className="container mx-auto px-4 py-8">
                <SupabaseBanner />
            </div>
        )
    }

    const supabase = await getSupabaseServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login?redirect=/resume-editor")
    }

    const resolvedParams = await Promise.resolve(searchParams ?? {})
    const activeId = typeof resolvedParams?.id === "string" ? resolvedParams.id : null

    const { data: rows } = await supabase
        .from("rewritten_resumes")
        .select("id, content, structured_data, variant, theme, mode, pdf_url, file_name, created_at, updated_at, ats_score_before, ats_score_after")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(3)

    const saved = (rows || []).map(mapRowToResume)
    const activeResume = activeId ? saved.find((item) => item.id === activeId) : saved[0]

    // If requested resume not found but we have other resumes, redirect to the first one
    if (saved.length > 0 && !activeResume && activeId) {
        redirect(`/resume-editor?id=${saved[0].id}`)
    }

    if (!saved.length || !activeResume) {
        return (
            <div className="min-h-screen relative pb-20">
                <GlobalHeader variant="back" backHref="/dashboard" backLabel="Back to Dashboard" />
                <div className="container mx-auto px-4 py-10 max-w-3xl">
                    <Card className="glass-card p-8 text-center space-y-4">
                        <h1 className="text-3xl font-bold">{!saved.length ? "No resumes yet" : "Resume not found"}</h1>
                        <p className="text-muted-foreground">
                            {!saved.length
                                ? "Upload a resume and run an analysis from the dashboard to start editing in the Resume Editor."
                                : "The requested resume may have been deleted. Please select another resume or create a new one."}
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button asChild>
                                <Link href="/dashboard">Go to Dashboard</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/dashboard#upload">Upload resume</Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <ResumeEditor
            initialData={activeResume.data}
            initialVariant={activeResume.variant}
            initialTheme={activeResume.theme}
            initialMode={activeResume.mode}
            resumeId={activeResume.id}
            recentResumes={saved}
            backHref="/dashboard"
        />
    )
}
