"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, Loader2, Trash2, Sparkles, CheckCircle2, ArrowRightLeft, AlertCircle } from "lucide-react"
import type { SkillMapRecord } from "@/types/skill-map"

interface SkillMapPanelProps {
    activeResumeId: string | null
    resumeName: string
    skillMaps: SkillMapRecord[]
    loading: boolean
    forceLoading?: boolean
    error: string | null
    onReload: () => void
    onDelete: (id: string) => void
    deletingId: string | null
    generating: boolean
    onGenerate: () => void
}

export function SkillMapPanel({
    activeResumeId,
    resumeName,
    skillMaps,
    loading,
    forceLoading = false,
    error,
    onReload,
    onDelete,
    deletingId,
    generating,
    onGenerate
}: SkillMapPanelProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500"
        if (score >= 60) return "text-yellow-500"
        return "text-red-500"
    }

    const renderHeader = () => (
        <div className="flex items-center justify-between gap-3 mb-4">
            <div>
                <p className="text-sm font-semibold">Skill Analysis</p>
                <p className="text-xs text-muted-foreground">
                    {activeResumeId ? `Analysis for ${resumeName}` : 'Save your adapted resume to view skill analysis.'}
                </p>
            </div>
            {skillMaps.length > 0 && !forceLoading && !loading && (
                <Badge variant="outline" className="text-[11px]">
                    {skillMaps.length} saved
                </Badge>
            )}
        </div>
    )

    const renderLoader = () => (
        <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                    <p className="text-sm font-medium">Loading Skill Analysis</p>
                    <p className="text-xs text-muted-foreground mt-1">Analyzing your skills and job requirements...</p>
                </div>
            </div>
            <div className="space-y-3 mt-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-11/12" />
            </div>
        </div>
    )

    const renderEmpty = () => {
        const disabled = !activeResumeId || generating

        return (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4 md:p-5 space-y-3 text-sm text-muted-foreground">
                <div className="space-y-1">
                    <p className="font-semibold text-foreground">Generate a Skill Map</p>
                    <p>Analyze how your skills match the job requirements.</p>
                    <p className="text-xs md:text-sm">See what skills you have, which are transferable, and what to learn next.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        size="sm"
                        className="gap-2"
                        onClick={onGenerate}
                        disabled={disabled}
                    >
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {generating ? 'Analyzing...' : 'Generate'}
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
            <p className="text-sm font-semibold text-destructive">Failed to load skill analysis</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="ghost" size="sm" className="mt-3 gap-2" onClick={onReload} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Try again</span>}
            </Button>
        </div>
    )

    const renderSkillMaps = () => (
        <div className="space-y-4">
            {skillMaps.map((skillMap) => {
                const timestamp = skillMap.updated_at || skillMap.created_at
                const timestampDate = timestamp ? new Date(timestamp) : null
                const relativeTime =
                    timestampDate && !Number.isNaN(timestampDate.getTime())
                        ? formatDistanceToNow(timestampDate, { addSuffix: true })
                        : 'Recently saved'

                const data = skillMap.data
                const matchScore = skillMap.match_score
                const adaptationScore = skillMap.adaptation_score

                return (
                    <Card key={skillMap.id} className="border border-border/60 bg-background/60 p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] text-muted-foreground">{relativeTime}</p>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/skill-map/${skillMap.id}`} aria-label="Open skill map detail">
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Delete skill map"
                                    onClick={() => onDelete(skillMap.id)}
                                    disabled={deletingId === skillMap.id}
                                >
                                    {deletingId === skillMap.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Main Score */}
                        {(() => {
                            const hasAdaptation = adaptationScore !== undefined && adaptationScore !== null
                            const mainScore = hasAdaptation ? adaptationScore : matchScore
                            const mainLabel = hasAdaptation ? "Adaptation" : "Match Score"
                            
                            return (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            {hasAdaptation && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                                            <span className="text-xs text-muted-foreground">{mainLabel}</span>
                                        </div>
                                        <span className={`text-2xl font-bold tabular-nums ${getScoreColor(mainScore)}`}>
                                            {mainScore}%
                                        </span>
                                    </div>
                                    <Progress value={mainScore} className="h-2" />
                                </div>
                            )
                        })()}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-green-500/10 p-2">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-500">Matched</span>
                                </div>
                                <p className="text-lg font-bold text-green-500">
                                    {data.matchedSkills?.length || 0}
                                </p>
                            </div>
                            <div className="rounded-lg bg-blue-500/10 p-2">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <ArrowRightLeft className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs text-blue-500">Transfer</span>
                                </div>
                                <p className="text-lg font-bold text-blue-500">
                                    {data.transferableSkills?.length || 0}
                                </p>
                            </div>
                            <div className="rounded-lg bg-yellow-500/10 p-2">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                                    <span className="text-xs text-yellow-500">Missing</span>
                                </div>
                                <p className="text-lg font-bold text-yellow-500">
                                    {data.missingSkills?.length || 0}
                                </p>
                            </div>
                        </div>

                        {/* Summary */}
                        {data.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {data.summary}
                            </p>
                        )}

                        {/* View Details Link */}
                        <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                            <Link href={`/skill-map/${skillMap.id}`}>
                                <ExternalLink className="h-4 w-4" />
                                View Full Analysis
                            </Link>
                        </Button>
                    </Card>
                )
            })}
        </div>
    )

    const showLoader = forceLoading || (loading && skillMaps.length === 0)

    return (
        <Card
            className="glass-card p-4 md:p-6 overflow-auto w-full md:max-w-[calc(210mm+3rem)] md:min-w-[calc(210mm+3rem)]"
        >
            {renderHeader()}

            {!activeResumeId ? (
                <p className="text-sm text-muted-foreground">
                    Save your adapted resume to view and generate skill analysis.
                </p>
            ) : error ? (
                renderError()
            ) : showLoader ? (
                renderLoader()
            ) : skillMaps.length === 0 ? (
                renderEmpty()
            ) : (
                renderSkillMaps()
            )}
        </Card>
    )
}
