"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"
import { GlobalHeader } from "@/components/global-header"
import { useAppSelector } from "@/lib/redux/hooks"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import ResumeUpload from "./resume-upload"
import JobPostingForm from "./job-posting-form"
import ResumeList from "./resume-list"
import AnalysisList from "./analysis-list"

interface DashboardClientProps {
  user: any
  resumes: any[]
  recentAnalyses: any[]
}

export default function DashboardClient({ user, resumes: initialResumes, recentAnalyses }: DashboardClientProps) {
  const router = useRouter()
  const authUser = useAppSelector((s) => s.auth.user)
  const [resumes, setResumes] = useState(initialResumes)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [jobPosting, setJobPosting] = useState({
    title: "",
    company: "",
    description: "",
    jobLink: "",
    inputType: "paste" as "paste" | "link",
  })
  const [analyzing, setAnalyzing] = useState(false)
  
  // Use Redux user name if available, fallback to props
  const displayName = authUser?.user_metadata?.full_name || user?.user_metadata?.full_name || "there"


  const handleResumeUploaded = (newResume: any) => {
    setResumes([newResume, ...resumes])
    setSelectedResumeId(newResume.id)
  }

  const handleAnalyze = async () => {
    const hasJobInfo =
      jobPosting.inputType === "paste" ? jobPosting.description.trim().length > 0 : jobPosting.jobLink.trim().length > 0

    if (!selectedResumeId || !jobPosting.title || !hasJobInfo) {
      return
    }

    setAnalyzing(true)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobPosting: {
            title: jobPosting.title,
            company: jobPosting.company,
            description: jobPosting.description,
            jobLink: jobPosting.jobLink,
            inputType: jobPosting.inputType,
          },
        }),
      })

      if (!response.ok) throw new Error("Analysis failed")

      const { analysisId } = await response.json()
      router.push(`/analysis/${analysisId}`)
    } catch (error) {
      console.error("Analysis error:", error)
      alert("Failed to analyze. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  const hasJobInfo =
    jobPosting.inputType === "paste" ? jobPosting.description.trim().length > 0 : jobPosting.jobLink.trim().length > 0
  const canAnalyze = selectedResumeId && jobPosting.title && hasJobInfo

  return (
    <div className="min-h-screen relative pb-20">
      
      <GlobalHeader variant="dashboard" />

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{displayName}</span>
          </h1>
          <p className="text-muted-foreground">
            Follow the simple steps below to analyze your resume against a job posting
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 min-w-0">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Step 1: Upload Resume */}
            <Card className="glass-card p-6 relative z-10 w-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                  1
                </div>
                <h2 className="text-2xl font-bold">Upload Your Resume</h2>
                {selectedResumeId && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
              </div>

              <ResumeUpload onResumeUploaded={handleResumeUploaded} />

              {resumes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                    Or select from your uploaded resumes:
                  </h3>
                  <ResumeList
                    resumes={resumes}
                    selectedResumeId={selectedResumeId}
                    onSelectResume={setSelectedResumeId}
                  />
                </div>
                )}
            </Card>

            {/* Step 2: Add Job Posting */}
            <Card className="glass-card p-6 relative z-10 w-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                  2
                </div>
                <h2 className="text-2xl font-bold">Add Job Posting</h2>
                {hasJobInfo && jobPosting.title && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
              </div>

              <JobPostingForm jobPosting={jobPosting} onChange={setJobPosting} />
            </Card>

            {/* Analyze Button */}
            <Card className="glass-card p-6 relative z-10 w-full">
              <Button onClick={handleAnalyze} disabled={!canAnalyze || analyzing} size="lg" className="w-full">
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Analyze with AI
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              {!canAnalyze && (
                <p className="text-sm text-muted-foreground text-center mt-3">
                  {!selectedResumeId && "Please upload or select a resume"}
                  {selectedResumeId && !jobPosting.title && "Please enter a job title"}
                  {selectedResumeId &&
                    jobPosting.title &&
                    !hasJobInfo &&
                    (jobPosting.inputType === "paste"
                      ? "Please paste the job description"
                      : "Please enter the job posting link")}
              </p>
            )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 min-w-0">
            {/* Recent Analyses */}
            <Card className="glass-card p-6 relative z-10 w-full">
              <h3 className="text-lg font-semibold mb-4">Recent Analyses</h3>
              <AnalysisList analyses={recentAnalyses} />
            </Card>

            {/* Quick Stats */}
            <Card className="glass-card p-6 relative z-10 w-full">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold gradient-text">{resumes.length}</div>
                  <div className="text-sm text-muted-foreground">Resumes Uploaded</div>
                </div>
                <div>
                  <div className="text-3xl font-bold gradient-text">{recentAnalyses.length}</div>
                  <div className="text-sm text-muted-foreground">Analyses Completed</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
