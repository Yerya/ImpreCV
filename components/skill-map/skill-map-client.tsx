"use client"

import { useState, useMemo, memo } from "react"
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
  TrendingUp,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GraduationCap,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react"
import type { SkillMapRecord, Skill, RoadmapItem, SkillPriority, AdaptationHighlight } from "@/types/skill-map"
import { cn } from "@/lib/utils"

interface SkillMapClientProps {
  skillMap: SkillMapRecord
}

const priorityConfig: Record<SkillPriority, { label: string; color: string; bgColor: string }> = {
  high: { label: "High", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
  medium: { label: "Medium", color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  low: { label: "Low", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
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

const SkillCard = memo(function SkillCard({ skill }: { skill: Skill }) {
  const [expanded, setExpanded] = useState(false)
  const config = priorityConfig[skill.priority]
  const hasDetails = skill.resumeEvidence || skill.jobRequirement

  return (
    <div
      className={cn(
        "p-3 md:p-4 rounded-lg border border-border/50 bg-background/50 transition-all overflow-hidden",
        hasDetails && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={() => hasDetails && setExpanded(!expanded)}
    >
      <div className="flex items-start md:items-center justify-between gap-2 md:gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 min-w-0 flex-1">
          <span className="font-medium text-sm md:text-base break-words">{skill.name}</span>
          <Badge variant="outline" className={cn("shrink-0 w-fit text-xs", config.bgColor, config.color)}>
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {skill.matchPercentage !== undefined && (
            <span className="text-xs md:text-sm text-muted-foreground tabular-nums">{skill.matchPercentage}%</span>
          )}
          {skill.potentialScoreIncrease !== undefined && skill.potentialScoreIncrease > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs hidden md:flex">
              <TrendingUp className="h-3 w-3" />
              +{skill.potentialScoreIncrease}%
            </Badge>
          )}
          {hasDetails && (
            expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {expanded && hasDetails && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-xs md:text-sm">
          {skill.resumeEvidence && (
            <div className="break-words">
              <span className="text-muted-foreground">Your experience: </span>
              <span>{skill.resumeEvidence}</span>
            </div>
          )}
          {skill.jobRequirement && (
            <div className="break-words">
              <span className="text-muted-foreground">Job requirement: </span>
              <span>{skill.jobRequirement}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

const RoadmapCard = memo(function RoadmapCard({ item }: { item: RoadmapItem }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="p-3 md:p-4 rounded-lg border border-border/50 bg-background/50 cursor-pointer hover:bg-muted/50 transition-all overflow-hidden"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm md:text-base break-words">{item.skill}</h4>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{item.importance}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Badge variant="secondary" className="gap-1 text-xs hidden md:flex">
            <TrendingUp className="h-3 w-3" />
            +{item.potentialScoreIncrease}%
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border/50">
          <div className="space-y-3">
            <div>
              <h5 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Why it matters</h5>
              <p className="text-xs md:text-sm break-words">{item.importance}</p>
            </div>
            <div>
              <h5 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">First step</h5>
              <p className="text-xs md:text-sm break-words">{item.firstStep}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

const AdaptationHighlightCard = memo(function AdaptationHighlightCard({ item }: { item: AdaptationHighlight }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="p-3 md:p-4 rounded-lg border border-border/50 bg-background/50 cursor-pointer hover:bg-muted/50 transition-all overflow-hidden"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm md:text-base break-words">{item.skill}</h4>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{item.improvement}</p>
          </div>
        </div>
        <div className="shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border/50 space-y-3">
          <div>
            <h5 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Original presentation</h5>
            <p className="text-xs md:text-sm bg-muted/50 p-2 rounded break-words">{item.originalPresentation || "Not explicitly mentioned"}</p>
          </div>
          <div>
            <h5 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">Adapted presentation</h5>
            <p className="text-xs md:text-sm bg-green-500/10 p-2 rounded break-words">{item.adaptedPresentation}</p>
          </div>
        </div>
      )}
    </div>
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

  const potentialMaxScore = useMemo(() => {
    const increase = data.learningRoadmap.reduce((sum, item) => sum + item.potentialScoreIncrease, 0)
    return Math.min(100, data.matchScore + increase)
  }, [data])

  return (
    <div className="min-h-screen relative pb-24 md:pb-20">
      <GlobalHeader variant="back" backHref="/resume-editor" backLabel="Back to Editor" />

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 relative z-10 max-w-5xl">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">
            <span className="gradient-text">Skill Map</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {skillMap.job_title && `Analysis for ${skillMap.job_title}`}
            {skillMap.job_company && ` at ${skillMap.job_company}`}
          </p>
        </div>

        {/* Match Score Card */}
        <Card className="glass-card p-4 md:p-8 mb-4 md:mb-6">
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="space-y-3 md:space-y-4 flex-1">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Target className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-3xl md:text-5xl font-bold", getScoreColor(data.matchScore))}>
                      {data.matchScore}%
                    </span>
                    <span className="text-sm md:text-lg text-muted-foreground">Match</span>
                  </div>
                  <p className={cn("text-xs md:text-sm font-medium", getScoreColor(data.matchScore))}>
                    {getScoreLabel(data.matchScore)}
                  </p>
                </div>
              </div>
              <Progress value={data.matchScore} className="h-2 md:h-3" />
              <p className="text-sm text-muted-foreground">{data.summary}</p>
              
              {/* Adaptation Score */}
              {data.adaptationScore !== undefined && (
                <div className="mt-3 pt-3 md:mt-4 md:pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs md:text-sm font-medium">Adaptation Quality</span>
                        <span className="text-xs md:text-sm font-bold text-blue-600 dark:text-blue-400">{data.adaptationScore}%</span>
                      </div>
                      <Progress value={data.adaptationScore} className="h-1.5 md:h-2" />
                    </div>
                  </div>
                  {data.adaptationSummary && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">{data.adaptationSummary}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Stats Row - horizontal on mobile, vertical on desktop */}
            <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:min-w-[200px]">
              <div className="flex-1 flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400 shrink-0" />
                <div>
                  <div className="font-semibold text-sm md:text-base text-green-600 dark:text-green-400">{stats.matched}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">Matched</div>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-yellow-500/10">
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div>
                  <div className="font-semibold text-sm md:text-base text-yellow-600 dark:text-yellow-400">{stats.transferable}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">Transfer</div>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-red-500/10">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <div className="font-semibold text-sm md:text-base text-red-600 dark:text-red-400">{stats.missing}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">Missing</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {/* Matched Skills */}
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Matched Skills</h2>
                <p className="text-xs md:text-sm text-muted-foreground">Skills you already have</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.matchedSkills.length > 0 ? (
                data.matchedSkills.map((skill, idx) => (
                  <SkillCard key={`matched-${idx}`} skill={skill} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No directly matched skills found.</p>
              )}
            </div>
          </Card>

          {/* Transferable Skills */}
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Transferable Skills</h2>
                <p className="text-xs md:text-sm text-muted-foreground">Related skills you can leverage</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.transferableSkills.length > 0 ? (
                data.transferableSkills.map((skill, idx) => (
                  <SkillCard key={`transferable-${idx}`} skill={skill} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No transferable skills identified.</p>
              )}
            </div>
          </Card>

          {/* Missing Skills */}
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Skills to Develop</h2>
                <p className="text-xs md:text-sm text-muted-foreground">Required skills you&apos;re missing</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.missingSkills.length > 0 ? (
                data.missingSkills.map((skill, idx) => (
                  <SkillCard key={`missing-${idx}`} skill={skill} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Great! No critical skills missing.</p>
              )}
            </div>
          </Card>

          {/* Interview Tips */}
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Interview Tips</h2>
                <p className="text-xs md:text-sm text-muted-foreground">How to present yourself</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.interviewTips.length > 0 ? (
                data.interviewTips.map((tip, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{tip}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No specific tips available.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Learning Roadmap */}
        {data.learningRoadmap.length > 0 && (
          <Card className="glass-card p-4 md:p-6 mt-4 md:mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold">Learning Roadmap</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">Your path to improvement</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-xs md:text-sm text-muted-foreground">Potential score</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-bold text-primary">{potentialMaxScore}%</span>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    +{potentialMaxScore - data.matchScore}%
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
              {data.learningRoadmap.map((item, idx) => (
                <RoadmapCard key={idx} item={item} />
              ))}
            </div>
          </Card>
        )}

        {/* Adaptation Highlights */}
        {data.adaptationHighlights && data.adaptationHighlights.length > 0 && (
          <Card className="glass-card p-4 md:p-6 mt-4 md:mt-6">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Adaptation Highlights</h2>
                <p className="text-xs md:text-sm text-muted-foreground">How your resume was improved</p>
              </div>
            </div>
            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
              {data.adaptationHighlights.map((item, idx) => (
                <AdaptationHighlightCard key={idx} item={item} />
              ))}
            </div>
          </Card>
        )}
      </div>
      <MobileBottomNav />
    </div>
  )
}
