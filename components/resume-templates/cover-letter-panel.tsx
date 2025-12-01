"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, ExternalLink, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

export interface CoverLetter {
    id: string
    content: string
    jobTitle?: string | null
    jobCompany?: string | null
    rewrittenResumeId?: string | null
    createdAt?: string | null
    updatedAt?: string | null
}

interface CoverLetterPanelProps {
    activeResumeId: string | null
    resumeName: string
    coverLetters: CoverLetter[]
    loading: boolean
    forceLoading?: boolean
    error: string | null
    onReload: () => void
    onDelete: (id: string) => void
    deletingId: string | null
    generating: boolean
    onGenerate: () => void
}

export function CoverLetterPanel({
    activeResumeId,
    resumeName,
    coverLetters,
    loading,
    forceLoading = false,
    error,
    onReload,
    onDelete,
    deletingId,
    generating,
    onGenerate
}: CoverLetterPanelProps) {
    const handleCopy = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content)
            toast.success('Cover letter copied')
        } catch (copyError) {
            console.error('Cover letter copy failed:', copyError)
            toast.error('Failed to copy cover letter')
        }
    }

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <p className="text-sm font-semibold">Cover letters</p>
                    <p className="text-xs text-muted-foreground">
                        {activeResumeId ? `Linked to ${resumeName}` : 'Save your adapted resume to view its cover letter.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {(forceLoading || loading) && activeResumeId && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Loading</span>
                        </div>
                    )}
                    {coverLetters.length > 0 && (
                        <Badge variant="outline" className="text-[11px]">
                            {coverLetters.length} saved
                        </Badge>
                    )}
                </div>
            </div>
        )
    }

    const renderLoader = () => (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading cover letter...</span>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-11/12" />
                <Skeleton className="h-3 w-10/12" />
            </div>
        </div>
    )

    const renderEmpty = () => {
        const disabled = !activeResumeId || generating

        return (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4 md:p-5 space-y-3 text-sm text-muted-foreground">
                <div className="space-y-1">
                    <p className="font-semibold text-foreground">Generate a cover letter</p>
                    <p>We will reuse the job context from when this resume was tailored.</p>
                    <p className="text-xs md:text-sm">No cover letter is linked yet — create one now or refresh if you generated it elsewhere.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => onGenerate()}
                        disabled={disabled}
                    >
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {generating ? 'Generating...' : 'Generate'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={onReload}
                        disabled={loading || !activeResumeId}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </div>
        )
    }

    const renderError = () => (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm font-semibold text-destructive">Failed to load cover letter</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="ghost" size="sm" className="mt-3 gap-2" onClick={onReload} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Try again</span>}
            </Button>
        </div>
    )

    const renderLetters = () => (
        <div className="space-y-4">
            {coverLetters.map((letter) => {
                const timestamp = letter.updatedAt || letter.createdAt
                const timestampDate = timestamp ? new Date(timestamp) : null
                const relativeTime =
                    timestampDate && !Number.isNaN(timestampDate.getTime())
                        ? `Updated ${formatDistanceToNow(timestampDate, { addSuffix: true })}`
                        : 'Saved recently'

                return (
                    <Card key={letter.id} className="border border-border/60 bg-background/60 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">{letter.jobTitle || 'Cover letter'}</p>
                                {letter.jobCompany && (
                                    <p className="text-xs text-muted-foreground">{letter.jobCompany}</p>
                                )}
                                <p className="text-[11px] text-muted-foreground">{relativeTime}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => handleCopy(letter.content)}
                                    >
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </Button>
                                    {letter.id && (
                                        <>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/cover-letter/${letter.id}`} aria-label="Open cover letter detail">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Delete cover letter"
                                                onClick={() => onDelete(letter.id)}
                                                disabled={deletingId === letter.id}
                                            >
                                                {deletingId === letter.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-sm">
                            {letter.content}
                        </div>
                    </Card>
                )
            })}
        </div>
    )

    const showLoader = forceLoading || (loading && coverLetters.length === 0)

    return (
        <Card
            className="glass-card p-4 md:p-6 overflow-auto"
            style={{ maxWidth: 'calc(210mm + 3rem)', minWidth: 'calc(210mm + 3rem)' }}
        >
            {renderHeader()}

            {!activeResumeId ? (
                <p className="text-sm text-muted-foreground">
                    Save your adapted resume to view and manage its linked cover letters.
                </p>
            ) : error ? (
                renderError()
            ) : showLoader ? (
                renderLoader()
            ) : coverLetters.length === 0 ? (
                renderEmpty()
            ) : (
                renderLetters()
            )}
        </Card>
    )
}
