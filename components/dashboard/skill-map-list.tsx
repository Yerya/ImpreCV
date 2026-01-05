"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Sparkles, Target } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface SkillMapRecord {
  id: string
  match_score: number
  adaptation_score?: number
  created_at: string
  job_title?: string | null
  job_company?: string | null
}

interface SkillMapListProps {
  skillMaps: SkillMapRecord[]
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-red-500 dark:text-red-400"
}

export default function SkillMapList({ skillMaps }: SkillMapListProps) {
  if (skillMaps.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No analyses yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {skillMaps.map((skillMap) => {
        const hasAdaptation = skillMap.adaptation_score !== undefined && skillMap.adaptation_score !== null
        const adaptationScore = skillMap.adaptation_score ?? skillMap.match_score
        const timeAgo = formatDistanceToNow(new Date(skillMap.created_at), { addSuffix: false })
        
        // Create job position text
        const jobPosition = [skillMap.job_title, skillMap.job_company]
          .filter(Boolean)
          .join(' • ')
        
        return (
          <Link key={skillMap.id} href={`/skill-map/${skillMap.id}`}>
            <Card className="p-3 bg-background/30 hover:bg-background/50 border-border/30 hover:border-border/50 transition-all cursor-pointer group">
              <div className="flex items-center justify-between gap-3">
                {/* Left: Icon + Score */}
                <div className="flex items-center gap-2">
                  {hasAdaptation ? (
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn("text-xl font-bold tabular-nums", getScoreColor(adaptationScore))}>
                    {adaptationScore}%
                  </span>
                </div>

                {/* Right: Arrow */}
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
              
              <Progress value={adaptationScore} className="h-1.5 my-2" />
              
              {/* Job Info and Time */}
              <div className="flex items-center justify-between gap-2 text-xs">
                {jobPosition ? (
                  <span className="text-foreground/80 truncate font-medium">{jobPosition}</span>
                ) : (
                  <span className="text-muted-foreground">No position info</span>
                )}
                <span className="text-muted-foreground shrink-0">{timeAgo} ago</span>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
