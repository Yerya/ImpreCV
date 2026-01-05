"use client"

import { useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GlobalHeader } from "@/components/global-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import {
  CheckCircle2,
  ArrowRight,
  Target,
  Lightbulb,
  Sparkles,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react"
import type { SkillMapRecord, Skill } from "@/types/skill-map"
import { cn } from "@/lib/utils"

interface SkillMapClientProps {
  skillMap: SkillMapRecord
}

// Colors based on category, not priority
const categoryConfig: Record<string, { color: string; bgColor: string }> = {
  matched: { color: "text-green-700 dark:text-green-300", bgColor: "bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800" },
  transferable: { color: "text-yellow-700 dark:text-yellow-300", bgColor: "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800" },
  missing: { color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800" },
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent Match"
  if (score >= 60) return "Good Match"
  if (score >= 40) return "Partial Match"
  return "Needs Improvement"
}

const SkillBadge = memo(function SkillBadge({ skill }: { skill: Skill }) {
  const config = categoryConfig[skill.category] || categoryConfig.matched

  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs py-1 px-2.5 font-medium", config.bgColor, config.color)}
    >
      {skill.name}
    </Badge>
  )
})

export default function SkillMapClient({ skillMap }: SkillMapClientProps) {
  const router = useRouter()
  const data = skillMap.data

  const stats = useMemo(() => ({
    total: data.matchedSkills.length + data.transferableSkills.length + data.missingSkills.length,
    matched: data.matchedSkills.length,
    transferable: data.transferableSkills.length,
    missing: data.missingSkills.length,
  }), [data])

  // Show adaptation score as the main metric if available
  const hasAdaptation = data.adaptationScore !== undefined
  const mainScore = hasAdaptation ? data.adaptationScore! : data.matchScore
  const mainLabel = hasAdaptation ? "Adapted Resume" : "Resume Match"

  return (
    <div className="min-h-screen relative pb-24 md:pb-20">
      <GlobalHeader variant="back" backHref="/resume-editor" backLabel="Back to Editor" />

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 relative z-10 max-w-4xl">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            <span className="gradient-text">Skill Map</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {skillMap.job_title && `${skillMap.job_title}`}
            {skillMap.job_company && ` at ${skillMap.job_company}`}
          </p>
        </div>

        {/* Main Score Card */}
        <Card className="glass-card p-4 md:p-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            {/* Main Score - Adaptation or Match */}
            <div className="flex items-center gap-3 flex-1">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {hasAdaptation ? (
                  <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                ) : (
                  <Target className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-3xl md:text-4xl font-bold", getScoreColor(mainScore))}>
                    {mainScore}%
                  </span>
                  <span className="text-sm text-muted-foreground">{mainLabel}</span>
                </div>
                <Progress value={mainScore} className="h-2 mt-2" />
                <p className={cn("text-xs font-medium mt-1", getScoreColor(mainScore))}>
                  {getScoreLabel(mainScore)}
                </p>
              </div>
            </div>

            {/* Original Match (shown smaller if we have adaptation) */}
            {hasAdaptation && (
              <div className="flex items-center gap-3 md:border-l md:pl-6 md:border-border/50">
                <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Original Match</div>
                  <div className="text-xl font-semibold">{data.matchScore}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {data.adaptationSummary && (
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
              {data.adaptationSummary}
            </p>
          )}
          {!data.adaptationSummary && data.summary && (
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
              {data.summary}
            </p>
          )}
        </Card>

        {/* Skills Stats Row */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <div className="font-semibold text-lg text-green-600 dark:text-green-400">{stats.matched}</div>
              <div className="text-[10px] text-muted-foreground">Matched</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10">
            <ArrowUpRight className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <div>
              <div className="font-semibold text-lg text-yellow-600 dark:text-yellow-400">{stats.transferable}</div>
              <div className="text-[10px] text-muted-foreground">Transfer</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <div className="font-semibold text-lg text-red-600 dark:text-red-400">{stats.missing}</div>
              <div className="text-[10px] text-muted-foreground">Missing</div>
            </div>
          </div>
        </div>

        {/* Skills Lists - Compact */}
        <div className="grid gap-3 md:grid-cols-3 mb-4">
          {/* Matched Skills */}
          <Card className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-sm">Matched</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.matchedSkills.length > 0 ? (
                data.matchedSkills.map((skill, idx) => (
                  <SkillBadge key={`matched-${idx}`} skill={skill} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">None found</p>
              )}
            </div>
          </Card>

          {/* Transferable Skills */}
          <Card className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-sm">Transferable</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.transferableSkills.length > 0 ? (
                data.transferableSkills.map((skill, idx) => (
                  <SkillBadge key={`transferable-${idx}`} skill={skill} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">None identified</p>
              )}
            </div>
          </Card>

          {/* Missing Skills */}
          <Card className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-sm">To Develop</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.missingSkills.length > 0 ? (
                data.missingSkills.map((skill, idx) => (
                  <SkillBadge key={`missing-${idx}`} skill={skill} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">None critical</p>
              )}
            </div>
          </Card>
        </div>

        {/* Interview Tips - Compact */}
        {data.interviewTips.length > 0 && (
          <Card className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Interview Tips</h3>
            </div>
            <ul className="space-y-2">
              {data.interviewTips.slice(0, 3).map((tip, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-primary shrink-0">•</span>
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Action Button */}
        <div className="mt-6 flex justify-center">
          <Button onClick={() => router.push("/resume-editor")} size="lg">
            <ArrowRight className="mr-2 h-4 w-4" />
            Back to Resume Editor
          </Button>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
