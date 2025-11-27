"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, ArrowRight, CheckCircle2, Sparkles, Copy, RefreshCw, Check, Save } from "lucide-react"
import { GlobalHeader } from "@/components/global-header"
import { useAppSelector } from "@/lib/redux/hooks"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import ResumeUpload from "./resume-upload"
import JobPostingForm from "./job-posting-form"
import ResumeList from "./resume-list"
import AnalysisList from "./analysis-list"
import { AdaptedResumeItem, AdaptedResumeList } from "./adapted-resume-list"
import { analyzeResume } from "@/lib/api-client"
import { toast } from "sonner"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { isMeaningfulText, sanitizePlainText } from "@/lib/text-utils"
import { normalizeJobLink } from "@/lib/job-posting"

interface DashboardClientProps {
  user: any
  resumes: any[]
  recentAnalyses: any[]
  savedAdaptedResumes: AdaptedResumeItem[]
}

export default function DashboardClient({
  user,
  resumes: initialResumes,
  recentAnalyses,
  savedAdaptedResumes,
}: DashboardClientProps) {
  const authUser = useAppSelector((s) => s.auth.user)
  const [resumes, setResumes] = useState(initialResumes)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [jobPosting, setJobPosting] = useState({
    description: "",
    jobLink: "",
    inputType: "paste" as "paste" | "link",
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [adaptedResume, setAdaptedResume] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savedAdapted, setSavedAdapted] = useState<AdaptedResumeItem[]>(savedAdaptedResumes || [])
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [savingAdapted, setSavingAdapted] = useState(false)
  const [deletingSavedId, setDeletingSavedId] = useState<string | null>(null)
  const [lastRequestKey, setLastRequestKey] = useState<string | null>(null)

  // Use Redux user name if available, fallback to props
  const displayName = authUser?.user_metadata?.full_name || user?.user_metadata?.full_name || "there"

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("cvify:lastAdaptRequest")
    if (stored) {
      setLastRequestKey(stored)
    }
  }, [])

  const setRequestKey = (key: string) => {
    setLastRequestKey(key)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cvify:lastAdaptRequest", key)
    }
  }

  const clearRequestKey = () => {
    setLastRequestKey(null)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("cvify:lastAdaptRequest")
    }
  }


  const handleResumeUploaded = (newResume: any) => {
    setInputError(null)
    setResumes((prev) => [newResume, ...prev])
    setSelectedResumeId(newResume.id)
    setResumeText("")
    clearRequestKey()
  }

  const handleDeleteResume = async (id: string) => {
    setInputError(null)
    setDeletingId(id)
    try {
      const response = await fetch(`/api/resumes/${id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof data.error === "string" ? data.error : "Failed to delete resume."
        throw new Error(message)
      }
      setResumes((prev) => prev.filter((r) => r.id !== id))
      if (selectedResumeId === id) {
        setSelectedResumeId(null)
      }
      toast.success("Resume deleted")
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete resume.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleResumeTextChange = (text: string) => {
    setInputError(null)
    setResumeText(text)
    clearRequestKey()
    if (text) {
      setSelectedResumeId(null) // Clear selected file if typing text
    }
  }

  const handleJobPostingChange = (updatedPosting: typeof jobPosting) => {
    setInputError(null)
    setJobPosting(updatedPosting)
    clearRequestKey()
  }

  const validateTextInputs = (resume: string, jobText: string) => {
    const cleanedResume = sanitizePlainText(resume)
    const cleanedJobText = sanitizePlainText(jobText)

    if (!isMeaningfulText(cleanedResume) || !isMeaningfulText(cleanedJobText)) {
      setInputError("This doesn't look like a resume or a job description. Please upload your resume and vacancy details.")
      toast.error("Invalid information. Upload your resume and vacancy description.")
      return null
    }

    setInputError(null)
    return {
      cleanedResume,
      cleanedJobText,
    }
  }

  const buildRequestKey = (opts: { resumeId?: string | null; resumeText?: string; jobText?: string; jobLink?: string }) => {
    const resumeKey = opts.resumeId ? `res:${opts.resumeId}` : `text:${sanitizePlainText(opts.resumeText || "").slice(0, 500)}`
    const jobKey = opts.jobLink
      ? `link:${opts.jobLink.trim()}`
      : `desc:${sanitizePlainText(opts.jobText || "").slice(0, 500)}`
    return `${resumeKey}|${jobKey}`
  }

  const handleAnalyze = async () => {
    const hasJobInfo =
      jobPosting.inputType === "paste" ? jobPosting.description.trim().length > 0 : jobPosting.jobLink.trim().length > 0
    const normalizedLink = normalizeJobLink(jobPosting.jobLink)
    if (jobPosting.inputType === "link" && jobPosting.jobLink.trim() && !normalizedLink) {
      setInputError("Please enter a valid job link (http/https).")
      toast.error("Invalid job link. Please use a full URL.")
      return
    }

    // Allow analysis if we have resume text OR a selected resume ID
    const hasResume = selectedResumeId || resumeText.trim().length > 0

    if (!hasResume || !hasJobInfo) {
      return
    }

    setAdaptedResume(null)
    setSelectedSavedId(null)
    setInputError(null)
    const usingLinkOnly = jobPosting.inputType === "link" && normalizedLink && !jobPosting.description.trim()
    const jobText = jobPosting.inputType === "paste" ? jobPosting.description : jobPosting.description || normalizedLink

    // If we have resume text, use the "text-only" flow
    if (resumeText.trim().length > 0) {
      const cleanedResume = sanitizePlainText(resumeText)

      if (!isMeaningfulText(cleanedResume)) {
        setInputError("This doesn't look like a resume. Please upload your resume.")
        toast.error("Invalid resume text. Please upload your resume.")
        return
      }

      if (!usingLinkOnly) {
        const validated = validateTextInputs(resumeText, jobText)
        if (!validated) {
          return
        }
      }

      const requestKey = buildRequestKey({
        resumeText: cleanedResume,
        jobText: usingLinkOnly ? "" : sanitizePlainText(jobText),
        jobLink: usingLinkOnly ? normalizedLink || "" : undefined,
      })
      if (lastRequestKey === requestKey) {
        const message = "Already adapted this resume for this job. Check your saved adapted resumes."
        setInputError(message)
        toast.info(message)
        return
      }

      setAnalyzing(true)

      try {
        const result = await analyzeResume({
          resumeText: cleanedResume,
          jobDescription: usingLinkOnly ? "" : sanitizePlainText(jobText),
          jobLink: normalizedLink,
        })
        setAdaptedResume(result)
        setSelectedSavedId(null)
        setRequestKey(requestKey)
        toast.success("Resume adapted successfully!")
        void saveAdapted(result)
      } catch (error: any) {
        console.error("Analysis error:", error)
        toast.error(error.message || "Failed to analyze. Please try again.")
      } finally {
        setAnalyzing(false)
      }

      return
    }

    if (selectedResumeId) {
      if (jobPosting.inputType === "paste") {
        const cleanedJob = sanitizePlainText(jobPosting.description)
        if (!isMeaningfulText(cleanedJob)) {
          setInputError("This doesn't look like a job description. Please paste the vacancy text.")
          toast.error("Invalid job description text.")
          return
        }
      }

      const requestKey = buildRequestKey({
        resumeId: selectedResumeId,
        jobText: jobPosting.inputType === "paste" ? sanitizePlainText(jobPosting.description) : "",
        jobLink: jobPosting.inputType === "link" ? normalizedLink || jobPosting.jobLink.trim() : "",
      })
      if (lastRequestKey === requestKey) {
        const message = "Already adapted this resume for this job. Check your saved adapted resumes."
        setInputError(message)
        toast.info(message)
        return
      }

      setAnalyzing(true)
      try {
        const result = await analyzeResume({
          resumeId: selectedResumeId,
          jobDescription: jobPosting.inputType === "paste" ? jobPosting.description : "",
          jobLink: normalizedLink,
        })
        setAdaptedResume(result)
        setSelectedSavedId(null)
        setRequestKey(requestKey)
        toast.success("Resume adapted successfully!")
        void saveAdapted(result)
      } catch (error: any) {
        console.error("Analysis error:", error)
        toast.error(error.message || "Failed to analyze. Please try again.")
      } finally {
        setAnalyzing(false)
      }
    }
  }

  const hasJobInfo =
    jobPosting.inputType === "paste" ? jobPosting.description.trim().length > 0 : jobPosting.jobLink.trim().length > 0
  const canAnalyze = (selectedResumeId || resumeText.trim().length > 0) && hasJobInfo

  const saveAdapted = async (content: string) => {
    if (!content || savingAdapted) return

    const existing = savedAdapted.find((item) => item.content === content)
    if (existing) {
      setSelectedSavedId(existing.id)
      toast.success("Already saved")
      return
    }

    setSavingAdapted(true)
    try {
      const response = await fetch("/api/rewritten-resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, resumeId: selectedResumeId || null }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = typeof data.error === "string" ? data.error : "Failed to save adapted resume."
        throw new Error(message)
      }

      const saved = data.item as AdaptedResumeItem
      setSavedAdapted((prev) => {
        const next = [saved, ...prev]
        return next.slice(0, 3)
      })
      setSelectedSavedId(saved.id)
      toast.success("Adapted resume saved")
    } catch (error: any) {
      toast.error(error?.message || "Failed to save adapted resume.")
    } finally {
      setSavingAdapted(false)
    }
  }

  const handleDeleteSaved = async (id: string) => {
    setDeletingSavedId(id)
    try {
      const response = await fetch(`/api/rewritten-resumes/${id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof data.error === "string" ? data.error : "Failed to delete adapted resume."
        throw new Error(message)
      }
      setSavedAdapted((prev) => prev.filter((item) => item.id !== id))
      if (selectedSavedId === id) {
        setSelectedSavedId(null)
        setAdaptedResume(null)
      }
      clearRequestKey()
      toast.success("Adapted resume deleted")
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete adapted resume.")
    } finally {
      setDeletingSavedId(null)
    }
  }

  const handleUseSaved = (item: AdaptedResumeItem) => {
    setAdaptedResume(item.content)
    setSelectedSavedId(item.id)
    setCopied(false)
  }

  const copyToClipboard = () => {
    if (adaptedResume) {
      navigator.clipboard.writeText(adaptedResume)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
      toast.success("Copied to clipboard")
    }
  }

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
                {(selectedResumeId || resumeText.length > 0) && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
              </div>

              <ResumeUpload
                onResumeUploaded={handleResumeUploaded}
                onTextChange={handleResumeTextChange}
                currentCount={resumes.length}
                maxResumes={3}
              />

              {resumes.length > 0 && !resumeText && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                    Or select from your uploaded resumes:
                  </h3>
                  <ResumeList
                    resumes={resumes}
                    selectedResumeId={selectedResumeId}
                    onSelectResume={setSelectedResumeId}
                    onDeleteResume={handleDeleteResume}
                    deletingId={deletingId}
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
                {hasJobInfo && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
              </div>

              <JobPostingForm jobPosting={jobPosting} onChange={handleJobPostingChange} />
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
                  {!selectedResumeId && !resumeText && "Please upload or paste a resume"}
                  {(selectedResumeId || resumeText) &&
                    !hasJobInfo &&
                    (jobPosting.inputType === "paste"
                      ? "Please paste the job description"
                      : "Please enter the job posting link")}
                </p>
              )}
              {inputError && (
                <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
                  {inputError}
                </div>
              )}
            </Card>

            {/* Result Section */}
            {adaptedResume && (
              <Card className="glass-card p-6 relative z-10 w-full animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Adapted Resume
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => adaptedResume && void saveAdapted(adaptedResume)}
                      disabled={savingAdapted}
                    >
                      {savingAdapted ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      {savingAdapted ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAdaptedResume(null)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-secondary/40 to-background shadow-inner">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tailored resume</span>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Plain text</span>
                  </div>
                  <ScrollArea className="w-full h-auto">
                    <div className="overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words px-4 py-4 text-sm leading-relaxed font-mono text-foreground/90 max-w-full w-full [overflow-wrap:anywhere]">
                        {adaptedResume}
                      </pre>
                    </div>
                    <ScrollBar orientation="vertical" />
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 min-w-0">
            {/* Recent Analyses */}
            <Card className="glass-card p-6 relative z-10 w-full">
              <h3 className="text-xl font-semibold mb-4">Recent Analyses</h3>
              <AnalysisList analyses={recentAnalyses} />
            </Card>

            {/* Saved Adapted Resumes */}
            <Card className="glass-card p-6 relative z-10 w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">Saved Adapted Resumes</h3>
                <span className="text-xs text-muted-foreground">{savedAdapted.length}/3</span>
              </div>
              <AdaptedResumeList
                items={savedAdapted}
                selectedId={selectedSavedId}
                onUse={handleUseSaved}
                onDelete={handleDeleteSaved}
                deletingId={deletingSavedId}
              />
            </Card>

            {/* Quick Stats */}
            <Card className="glass-card p-6 relative z-10 w-full">
              <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
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
