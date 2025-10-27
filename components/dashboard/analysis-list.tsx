"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { ArrowRight, Sparkles } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AnalysisListProps {
  analyses: any[]
}

export default function AnalysisList({ analyses }: AnalysisListProps) {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No analyses yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {analyses.map((analysis) => (
        <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
          <Card className="p-4 bg-background/50 hover:bg-background/80 border-border/50 hover:border-border transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{analysis.job_postings?.title || "Untitled Job"}</p>
                {analysis.job_postings?.company && (
                  <p className="text-xs text-muted-foreground">{analysis.job_postings.company}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {analysis.match_score && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium">{analysis.match_score}% match</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
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
