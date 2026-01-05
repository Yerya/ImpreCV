"use client"

import { memo } from "react"
import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { MAX_ADAPTED_RESUMES } from "@/lib/constants"
import type { SavedResume } from "./types"

interface RecentResumesListProps {
    resumes: SavedResume[]
    activeResumeId: string | null
    deletingId: string | null
    onSelect: (resume: SavedResume) => void
    onDelete: (id: string | null) => void
    variant?: 'desktop' | 'mobile'
}

export const RecentResumesList = memo(function RecentResumesList({
    resumes,
    activeResumeId,
    deletingId,
    onSelect,
    onDelete,
    variant = 'desktop'
}: RecentResumesListProps) {
    if (resumes.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-4">
                Your generated resumes will appear here after analysis.
            </p>
        )
    }

    if (variant === 'mobile') {
        return (
            <div className="space-y-3">
                {resumes.map((resume) => {
                    const timestamp = resume.updatedAt || resume.createdAt
                    const isActive = resume.id === activeResumeId
                    const label = resume.data.personalInfo.title || resume.fileName || resume.data.personalInfo.name || 'Resume'
                    const timestampDate = timestamp ? new Date(timestamp) : null
                    const relativeTime =
                        timestampDate && !Number.isNaN(timestampDate.getTime())
                            ? `Updated ${formatDistanceToNow(timestampDate, { addSuffix: true })}`
                            : 'Recently saved'

                    return (
                        <div
                            key={resume.id || label}
                            className={cn(
                                'w-full rounded-xl border p-4 transition-all duration-200',
                                isActive
                                    ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5'
                                    : 'border-border/60'
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => onSelect(resume)}
                                    className="text-left flex-1 min-w-0"
                                >
                                    <p className="font-semibold truncate">{label}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">{relativeTime}</p>
                                </button>
                                <div className="flex items-center gap-2">
                                    {resume.pdfUrl && (
                                        <Badge variant="outline">PDF</Badge>
                                    )}
                                    {resume.id && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-9 w-9"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(resume.id)
                                            }}
                                            disabled={deletingId === resume.id}
                                        >
                                            {deletingId === resume.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Card className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold">Recent resumes</p>
                    <p className="text-sm text-muted-foreground">Pick a version to edit or export.</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                    {resumes.length}/{MAX_ADAPTED_RESUMES}
                </Badge>
            </div>
            <div className="space-y-2">
                {resumes.map((resume) => {
                    const timestamp = resume.updatedAt || resume.createdAt
                    const isActive = resume.id === activeResumeId
                    const label = resume.data.personalInfo.title || resume.fileName || resume.data.personalInfo.name || 'Resume'
                    const timestampDate = timestamp ? new Date(timestamp) : null
                    const relativeTime =
                        timestampDate && !Number.isNaN(timestampDate.getTime())
                            ? `Updated ${formatDistanceToNow(timestampDate, { addSuffix: true })}`
                            : 'Recently saved'

                    return (
                        <div
                            key={resume.id || label}
                            className={cn(
                                'w-full rounded-xl border p-3 transition-all duration-200',
                                isActive
                                    ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5'
                                    : 'border-border/60 hover:border-primary/50'
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => onSelect(resume)}
                                    className="text-left flex-1 min-w-0"
                                >
                                    <p className="text-sm font-semibold truncate">{label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {relativeTime}
                                    </p>
                                </button>
                                <div className="flex items-center gap-2">
                                    {resume.pdfUrl && (
                                        <Badge variant="outline" className="text-[10px]">
                                            PDF
                                        </Badge>
                                    )}
                                    {resume.id && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(resume.id)
                                            }}
                                            disabled={deletingId === resume.id}
                                        >
                                            {deletingId === resume.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
})
