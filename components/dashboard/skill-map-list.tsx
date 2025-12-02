"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { ArrowRight, Target, Sparkles } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface SkillMapListProps {
  skillMaps: any[]
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

export default function SkillMapList({ skillMaps }: SkillMapListProps) {
  if (skillMaps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No skill analyses yet</p>
        <p className="text-xs mt-1">Generate a Skill Map from your adapted resume</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {skillMaps.map((skillMap) => (
        <Link key={skillMap.id} href={`/skill-map/${skillMap.id}`}>
          <Card className="p-4 bg-background/50 hover:bg-background/80 border-border/50 hover:border-border transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {skillMap.job_title || "Job Analysis"}
                </p>
                {skillMap.job_company && (
                  <p className="text-xs text-muted-foreground">{skillMap.job_company}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-primary" />
                    <span className={cn("text-xs font-medium", getScoreColor(skillMap.match_score))}>
                      {skillMap.match_score}% match
                    </span>
                  </div>
                  {skillMap.adaptation_score && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {skillMap.adaptation_score}% adapted
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(skillMap.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
