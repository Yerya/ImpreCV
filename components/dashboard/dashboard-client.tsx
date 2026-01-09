"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Loader2, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { GlobalHeader } from "@/components/global-header"
import { useAppSelector } from "@/lib/redux/hooks"
import ResumeUpload from "./resume-upload"
import JobPostingForm from "./job-posting-form"
import ResumeList from "./resume-list"
import { WorkflowSelector, InlineModePicker, type WorkflowMode } from "./workflow-selector"
import { WizardFlow } from "./workflow-stepper"
import { CreateResumeForm } from "./create-resume-form"
import { ImproveResumeForm } from "./improve-resume-form"
import {
  analyzeResume,
  generateCoverLetter,
  improveResume,
  createResumeFromScratch,
  type GenerateCoverLetterResult,
  type CreateResumePayload,
  type ImproveResumePayload,
} from "@/lib/api-client"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { markCoverLetterPending, clearCoverLetterPending } from "@/lib/cover-letter-context"
import { toast } from "sonner"
import { isMeaningfulText, sanitizePlainText } from "@/lib/text-utils"
import { normalizeJobLink, isRestrictedJobSite } from "@/lib/job-posting"
import { MAX_RESUMES_PER_USER } from "@/lib/constants"

interface UserData {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface ResumeRecord {
  id: string
  file_name: string
  created_at: string
  [key: string]: unknown
}

interface SkillMapRecord {
  id: string
  match_score: number
  adaptation_score?: number
  created_at: string
  job_title?: string | null
  job_company?: string | null
}

interface DashboardClientProps {
  user: UserData
  resumes: ResumeRecord[]
  recentSkillMaps: SkillMapRecord[]
  adaptedResumesCount: number
}

export default function DashboardClient({
  user,
  resumes: initialResumes,
  recentSkillMaps,
}: DashboardClientProps) {
  const authUser = useAppSelector((s) => s.auth.user)
  const router = useRouter()

  // Workflow mode state
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("adapt")
  const [showModeSelector, setShowModeSelector] = useState<boolean | null>(null) // null = not hydrated yet

  // Resume state
  const [resumes, setResumes] = useState(initialResumes)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [resumeText, setResumeText] = useState("")

  // Job posting state (for adapt mode)
  const [jobPosting, setJobPosting] = useState({
    description: "",
    jobLink: "",
    inputType: "paste" as "paste" | "link",
  })

  // UI state
  const [analyzing, setAnalyzing] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lastRequestKey, setLastRequestKey] = useState<string | null>(null)
  const [shouldGenerateCoverLetter, setShouldGenerateCoverLetter] = useState(false)

  // Use Redux user name if available, fallback to props
  const displayName = authUser?.user_metadata?.full_name || user.user_metadata?.full_name || "there"

  // Sync resumes state when server props change (e.g., after navigation back from editor)
  useEffect(() => {
    setResumes(initialResumes)
    // If selected resume was deleted, clear selection
    if (selectedResumeId && !initialResumes.some(r => r.id === selectedResumeId)) {
      setSelectedResumeId(null)
    }
  }, [initialResumes, selectedResumeId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("cvify:lastAdaptRequest")
    if (stored) {
      setLastRequestKey(stored)
    }
    const storedCoverLetterPref = window.localStorage.getItem("cvify:shouldGenerateCoverLetter")
    if (storedCoverLetterPref) {
      setShouldGenerateCoverLetter(storedCoverLetterPref === "true")
    }
    // Restore adapt mode form data
    const storedAdaptForm = window.localStorage.getItem("cvify:adaptForm")
    if (storedAdaptForm) {
      try {
        const parsed = JSON.parse(storedAdaptForm)
        if (parsed.selectedResumeId) setSelectedResumeId(parsed.selectedResumeId)
        if (parsed.resumeText) setResumeText(parsed.resumeText)
        if (parsed.jobPosting) setJobPosting(parsed.jobPosting)
      } catch {
        // Ignore parse errors
      }
    }
    // Restore workflow mode and determine if we should show mode selector
    const storedMode = window.localStorage.getItem("cvify:workflowMode") as WorkflowMode | null
    if (storedMode && ["adapt", "improve", "create"].includes(storedMode)) {
      setWorkflowMode(storedMode)
      // User has previously selected a mode - skip selector
      setShowModeSelector(false)
    } else {
      // First time user - show mode selector
      setShowModeSelector(true)
    }
  }, [])

  // Save adapt form data to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    const adaptFormData = {
      selectedResumeId,
      resumeText,
      jobPosting,
    }
    window.localStorage.setItem("cvify:adaptForm", JSON.stringify(adaptFormData))
  }, [selectedResumeId, resumeText, jobPosting])

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

  const updateCoverLetterPreference = (value: boolean) => {
    setShouldGenerateCoverLetter(value)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cvify:shouldGenerateCoverLetter", value ? "true" : "false")
    }
  }

  // Select mode only (for WorkflowSelector cards) - don't save to localStorage yet
  const handleModeSelect = (mode: WorkflowMode) => {
    setWorkflowMode(mode)
    setInputError(null)
  }

  // Change mode and proceed (for InlineModePicker dropdown)
  const handleModeChange = (mode: WorkflowMode) => {
    setWorkflowMode(mode)
    setShowModeSelector(false)
    setInputError(null)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cvify:workflowMode", mode)
    }
  }

  // Continue to workflow steps - save mode to localStorage here
  const handleContinue = () => {
    setShowModeSelector(false)
    setInputError(null)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cvify:workflowMode", workflowMode)
    }
  }

  // Show skeleton while hydrating from localStorage
  if (showModeSelector === null) {
    return <DashboardSkeleton />
  }

  const handleResumeUploaded = (newResume: ResumeRecord) => {
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
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err?.message || "Failed to delete resume.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleResumeTextChange = (text: string) => {
    setInputError(null)
    setResumeText(text)
    clearRequestKey()
    if (text) {
      setSelectedResumeId(null)
    }
  }

  const handleSelectResume = (id: string) => {
    setSelectedResumeId(id)
    setResumeText("")
    setInputError(null)
  }

  const handleJobPostingChange = (updatedPosting: typeof jobPosting) => {
    setInputError(null)
    setJobPosting(updatedPosting)
    clearRequestKey()
  }

  const notifyCoverLetterResult = async (result: GenerateCoverLetterResult | null) => {
    if (!result) return

    if (result.warning) {
      toast.info(result.warning)
    }

    if (result.id) {
      toast.success("Cover letter generated and saved", {
        description: "Click to open and review.",
        action: {
          label: "Open",
          onClick: () => router.push(`/cover-letter/${result.id}`),
        },
      })
      return
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(result.content)
        toast.success("Cover letter copied to clipboard", {
          description: "Not saved to your account. Paste it into your email.",
        })
        return
      }
    } catch (error) {
      console.error("Clipboard copy failed for cover letter:", error)
    }

    toast.success("Cover letter generated", {
      description: "Copy it before leaving this page.",
    })
  }

  const buildRequestKey = (opts: { resumeId?: string | null; resumeText?: string; jobText?: string; jobLink?: string }) => {
    const resumeKey = opts.resumeId ? `res:${opts.resumeId}` : `text:${sanitizePlainText(opts.resumeText || "").slice(0, 500)}`
    const jobKey = opts.jobLink
      ? `link:${opts.jobLink.trim()}`
      : `desc:${sanitizePlainText(opts.jobText || "").slice(0, 500)}`
    return `${resumeKey}|${jobKey}`
  }

  // Handler for Adapt to Job mode
  const handleAnalyze = async () => {
    const hasJobInfo =
      jobPosting.inputType === "paste" ? jobPosting.description.trim().length > 0 : jobPosting.jobLink.trim().length > 0
    const normalizedLink = normalizeJobLink(jobPosting.jobLink)

    if (jobPosting.inputType === "link" && jobPosting.jobLink.trim()) {
      const restrictedCheck = isRestrictedJobSite(jobPosting.jobLink)
      if (restrictedCheck.isRestricted) {
        setInputError(restrictedCheck.message || "This site doesn't allow automated access. Please paste the job description instead.")
        toast.error("Unable to fetch from this site", {
          description: restrictedCheck.message,
        })
        return
      }
    }

    if (jobPosting.inputType === "link" && jobPosting.jobLink.trim() && !normalizedLink) {
      setInputError("Please enter a valid job link (http/https).")
      toast.error("Invalid job link. Please use a full URL.")
      return
    }

    const hasResume = selectedResumeId || resumeText.trim().length > 0

    if (!hasResume || !hasJobInfo) {
      return
    }

    setInputError(null)
    const usingResumeText = resumeText.trim().length > 0
    const cleanedResume = usingResumeText ? sanitizePlainText(resumeText) : ""
    const cleanedJobText = jobPosting.inputType === "paste" ? sanitizePlainText(jobPosting.description) : ""

    if (usingResumeText && !isMeaningfulText(cleanedResume)) {
      setInputError("This doesn't look like a resume. Please upload your resume.")
      return
    }

    if (jobPosting.inputType === "paste" && !isMeaningfulText(cleanedJobText)) {
      setInputError("This doesn't look like a job description. Please paste the vacancy text.")
      toast.error("Invalid job description text.")
      return
    }

    const requestKey = buildRequestKey({
      resumeId: selectedResumeId,
      resumeText: cleanedResume,
      jobText: jobPosting.inputType === "paste" ? cleanedJobText : "",
      jobLink: jobPosting.inputType === "link" ? normalizedLink || jobPosting.jobLink.trim() : "",
    })
    if (lastRequestKey === requestKey) {
      const message = "Already adapted this resume for this job. Open the Resume Editor to continue."
      setInputError(message)
      toast.info(message)
      return
    }

    setAnalyzing(true)
    try {
      const analyzePayload = {
        resumeId: selectedResumeId || undefined,
        resumeText: usingResumeText ? cleanedResume : undefined,
        jobDescription: jobPosting.inputType === "paste" ? jobPosting.description : "",
        jobLink: normalizedLink,
      }

      const result = await analyzeResume(analyzePayload)

      if (shouldGenerateCoverLetter && (selectedResumeId || usingResumeText)) {
        const coverLetterPayload = {
          rewrittenResumeId: result.id,
        }

        markCoverLetterPending(result.id)

        generateCoverLetter(coverLetterPayload)
          .then((letter) => {
            clearCoverLetterPending(result.id)
            notifyCoverLetterResult(letter)
          })
          .catch((error: unknown) => {
            console.error("Cover letter generation error:", error)
            clearCoverLetterPending(result.id)
            toast.error("Cover letter request failed. Try again from the dashboard.")
          })
      }

      setRequestKey(requestKey)
      toast.success(
        shouldGenerateCoverLetter ? "Resume adapted. Drafting cover letter in the background..." : "Resume adapted. Opening editor...",
      )
      router.push(`/resume-editor?id=${result.id}`)
    } catch (error: unknown) {
      const err = error as Error
      const rawMessage = err && typeof err.message === "string" ? err.message : "Failed to analyze. Please try again."

      if (rawMessage.includes("keep up to 3 adapted resumes")) {
        setInputError(null)
        toast.error("Resume limit reached", {
          description: "You can keep up to 3 adapted resumes. Please delete one from the Resume Editor.",
          action: {
            label: "Open Editor",
            onClick: () => router.push("/resume-editor"),
          },
        })
      } else if (rawMessage.includes("wait a few minutes")) {
        setInputError(null)
        toast.error("Please wait", {
          description: "You can re-adapt the same resume for this job in a few minutes.",
        })
      } else {
        console.error("Analysis error:", error)
        setInputError(rawMessage)
        toast.error(rawMessage)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  // Handler for Improve Resume mode
  const handleImproveResume = async (payload: ImproveResumePayload) => {
    setAnalyzing(true)
    setInputError(null)

    try {
      const result = await improveResume(payload)

      toast.success("Resume improved successfully!")
      router.push(`/resume-editor?id=${result.id}`)
    } catch (error: unknown) {
      const err = error as Error
      const message = err?.message || "Failed to improve resume. Please try again."

      if (message.includes("keep up to 3")) {
        toast.error("Resume limit reached", {
          description: "You can keep up to 3 resumes. Please delete one from the Resume Editor.",
          action: {
            label: "Open Editor",
            onClick: () => router.push("/resume-editor"),
          },
        })
      } else {
        setInputError(message)
        toast.error(message)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  // Handler for Create from Scratch mode
  const handleCreateResume = async (payload: CreateResumePayload) => {
    setAnalyzing(true)
    setInputError(null)

    try {
      const result = await createResumeFromScratch(payload)

      toast.success("Resume created successfully!")
      router.push(`/resume-editor?id=${result.id}`)
    } catch (error: unknown) {
      const err = error as Error
      const message = err?.message || "Failed to create resume. Please try again."

      if (message.includes("keep up to 3")) {
        toast.error("Resume limit reached", {
          description: "You can keep up to 3 resumes. Please delete one from the Resume Editor.",
          action: {
            label: "Open Editor",
            onClick: () => router.push("/resume-editor"),
          },
        })
      } else {
        setInputError(message)
        toast.error(message)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const hasJobInfo =
    jobPosting.inputType === "paste" ? jobPosting.description.trim().length > 0 : jobPosting.jobLink.trim().length > 0
  const canAnalyze = (selectedResumeId || resumeText.trim().length > 0) && hasJobInfo

  return (
    <div className="min-h-screen relative">
      <GlobalHeader variant="dashboard" />

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{displayName}</span>
          </h1>
          <p className="text-muted-foreground">
            {showModeSelector
              ? "What would you like to do today?"
              : "Complete the steps below"
            }
          </p>
        </div>

        {/* Mode Selector or Workflow Content */}
        {showModeSelector ? (
          <div className="pb-24 md:pb-0">
            <WorkflowSelector
              selectedMode={workflowMode}
              onModeChange={handleModeSelect}
            />

            {/* Fixed bottom button on mobile, normal flow on desktop */}
            <div className="fixed bottom-0 left-0 right-0 p-4 md:relative md:p-0 md:mt-8 z-50">
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleContinue}
                  className="w-full md:w-auto px-8"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mode Picker Header - above the grid */}
            <div className="flex items-center justify-center md:justify-start">
              <InlineModePicker
                selectedMode={workflowMode}
                onModeChange={handleModeChange}
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-6 min-w-0">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6 min-w-0">

                {/* Adapt to Job Mode */}
                {workflowMode === "adapt" && (
                  <WizardFlow
                    steps={[
                      {
                        id: "resume",
                        label: "Your Resume",
                        isComplete: !!(selectedResumeId || resumeText.length > 0),
                        hint: resumes.length > 0
                          ? "Select a resume from the list or upload a new one"
                          : "Upload or paste your resume",
                        content: (
                          <div className="space-y-4">
                            <ResumeUpload
                              onResumeUploaded={handleResumeUploaded}
                              onTextChange={handleResumeTextChange}
                              textValue={resumeText}
                              currentCount={resumes.length}
                              maxResumes={MAX_RESUMES_PER_USER}
                            />
                            {resumes.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                  Or select an uploaded resume:
                                </p>
                                <ResumeList
                                  resumes={resumes}
                                  selectedResumeId={selectedResumeId}
                                  onSelectResume={handleSelectResume}
                                  onDeleteResume={handleDeleteResume}
                                  deletingId={deletingId}
                                />
                              </div>
                            )}
                          </div>
                        ),
                      },
                      {
                        id: "job",
                        label: "Job Posting",
                        isComplete: hasJobInfo,
                        hint: jobPosting.inputType === "paste"
                          ? "Paste the job description"
                          : "Enter the job posting URL",
                        content: (
                          <JobPostingForm jobPosting={jobPosting} onChange={handleJobPostingChange} />
                        ),
                      },
                    ]}
                    completeButton={
                      <>
                        {/* Cover Letter Toggle */}
                        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-border/50 bg-muted/30 mb-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">Also generate cover letter</p>
                            <p className="text-xs text-muted-foreground">
                              Create a matching cover letter in background
                            </p>
                          </div>
                          <Switch
                            checked={shouldGenerateCoverLetter}
                            onCheckedChange={updateCoverLetterPreference}
                            disabled={analyzing}
                            aria-label="Toggle cover letter generation"
                          />
                        </div>
                        <Button
                          onClick={handleAnalyze}
                          disabled={!canAnalyze || analyzing}
                          size="lg"
                          className="w-full"
                        >
                          {analyzing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Adapting Resume...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-5 w-5" />
                              Adapt Resume to Job
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </>
                    }
                  />
                )}

                {/* Improve Resume Mode */}
                {workflowMode === "improve" && (
                  <ImproveResumeForm
                    resumes={resumes}
                    onResumeUploaded={handleResumeUploaded}
                    onDeleteResume={handleDeleteResume}
                    deletingId={deletingId}
                    onSubmit={handleImproveResume}
                    isSubmitting={analyzing}
                  />
                )}

                {/* Create from Scratch Mode */}
                {workflowMode === "create" && (
                  <CreateResumeForm
                    onSubmit={handleCreateResume}
                    isSubmitting={analyzing}
                  />
                )}

                {inputError && workflowMode !== "adapt" && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
                    {inputError}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="grid grid-cols-2 gap-3 lg:block lg:space-y-6 min-w-0">
                {/* Resume Editor - aligned with Your Resume */}
                <Card className="glass-card-primary p-4 lg:p-6 relative z-10 w-full flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg lg:text-xl font-semibold mb-1 leading-tight">Resume Editor</h3>
                      <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
                        Edit and export your tailored resumes in one place.
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-primary mt-1 shrink-0" />
                  </div>
                  <Button className="w-full mt-3 lg:mt-4 text-xs lg:text-sm h-8 lg:h-10" onClick={() => router.push("/resume-editor")}>
                    Open Editor
                  </Button>
                </Card>

                {/* Quick Stats */}
                <Card className="glass-card p-4 lg:p-6 relative z-10 w-full flex flex-col">
                  <h3 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-4 leading-tight">Quick Stats</h3>
                  <div className="space-y-2 lg:space-y-4 flex-1">
                    <div>
                      <div className="text-2xl lg:text-3xl font-bold gradient-text">{resumes.length}</div>
                      <div className="text-xs lg:text-sm text-muted-foreground leading-tight">Resumes Uploaded</div>
                    </div>
                    {workflowMode === "adapt" && (
                      <div>
                        <div className="text-2xl lg:text-3xl font-bold gradient-text">{recentSkillMaps.length}</div>
                        <div className="text-xs lg:text-sm text-muted-foreground leading-tight">Skill Analyses</div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  )
}
