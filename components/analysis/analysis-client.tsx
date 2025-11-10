"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GlobalHeader } from "@/components/global-header"
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileText,
  Mail,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

interface AnalysisClientProps {
  analysis: any
}

export default function AnalysisClient({ analysis }: AnalysisClientProps) {
  const router = useRouter()
  const [generatingResume, setGeneratingResume] = useState(false)
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false)
  const handleGenerateResume = async () => {
    setGeneratingResume(true)
    try {
      const response = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id }),
      })

      if (!response.ok) throw new Error("Failed to generate resume")

      const { rewriteId } = await response.json()
      router.push(`/resume-rewrite/${rewriteId}`)
    } catch (error) {
      console.error("Resume generation error:", error)
      alert("Failed to generate resume. Please try again.")
    } finally {
      setGeneratingResume(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    setGeneratingCoverLetter(true)
    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id }),
      })

      if (!response.ok) throw new Error("Failed to generate cover letter")

      const { coverLetterId } = await response.json()
      router.push(`/cover-letter/${coverLetterId}`)
    } catch (error) {
      console.error("Cover letter generation error:", error)
      alert("Failed to generate cover letter. Please try again.")
    } finally {
      setGeneratingCoverLetter(false)
    }
  }

  const matchScore = analysis.match_score || 0
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match"
    if (score >= 60) return "Good Match"
    return "Needs Improvement"
  }

  return (
    <div className="min-h-screen relative">
      <GlobalHeader variant="back" backHref="/dashboard" backLabel="Back to Dashboard" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Job Info Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Analysis Results</span>
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-lg">{analysis.job_postings?.title}</span>
            {analysis.job_postings?.company && (
              <>
                <span>•</span>
                <span>{analysis.job_postings.company}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Score Card */}
            <Card className="glass-card p-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Match Score</h2>
                <div className={`text-5xl font-bold ${getScoreColor(matchScore)}`}>{matchScore}%</div>
              </div>
              <Progress value={matchScore} className="h-3 mb-4" />
              <p className="text-muted-foreground">{getScoreLabel(matchScore)}</p>
            </Card>

            {/* Strengths */}
            <Card className="glass-card p-6 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold">Strengths</h3>
              </div>
              <ul className="space-y-3">
                {analysis.strengths?.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Gaps */}
            <Card className="glass-card p-6 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold">Areas for Improvement</h3>
              </div>
              <ul className="space-y-3">
                {analysis.gaps?.map((gap: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{gap}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Recommendations */}
            <Card className="glass-card p-6 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Recommendations</h3>
              </div>
              <ul className="space-y-3">
                {analysis.recommendations?.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">{index + 1}</span>
                    </div>
                    <span className="text-muted-foreground">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Keyword Analysis */}
            {analysis.keyword_analysis && (
              <Card className="glass-card p-6 relative z-10">
                <h3 className="text-xl font-semibold mb-4">Keyword Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2 text-green-500">Matched Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyword_analysis.matched?.map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-sm text-green-500"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 text-yellow-500">Missing Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyword_analysis.missing?.map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-500"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Steps */}
            <Card className="glass-card-primary p-6 relative z-10">
              <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleGenerateResume}
                  disabled={generatingResume}
                  className="w-full justify-between"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Rewrite Resume
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleGenerateCoverLetter}
                  disabled={generatingCoverLetter}
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Generate Cover Letter
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Resume Info */}
            <Card className="glass-card p-6 relative z-10">
              <h3 className="text-lg font-semibold mb-4">Resume Used</h3>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{analysis.resumes?.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Original resume</p>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card className="glass-card p-6 relative z-10">
              <h3 className="text-lg font-semibold mb-4">Pro Tips</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use the rewritten resume to highlight relevant experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Customize the cover letter with specific examples</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Address the missing keywords in your application</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
