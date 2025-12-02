"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Loader2, ArrowRight, CheckCircle2, Sparkles, Target } from "lucide-react"
import { GlobalHeader } from "@/components/global-header"
import { useAppSelector } from "@/lib/redux/hooks"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import ResumeUpload from "./resume-upload"
import JobPostingForm from "./job-posting-form"
import ResumeList from "./resume-list"
import SkillMapList from "./skill-map-list"
import { analyzeResume, generateCoverLetter, type GenerateCoverLetterResult } from "@/lib/api-client"
import { markCoverLetterPending, clearCoverLetterPending } from "@/lib/cover-letter-context"
import { toast } from "sonner"
import { isMeaningfulText, sanitizePlainText } from "@/lib/text-utils"
import { normalizeJobLink } from "@/lib/job-posting"

interface DashboardClientProps {
  user: any
  resumes: any[]
  recentSkillMaps: any[]
  adaptedResumesCount: number
}

export default function DashboardClient({
  user,
  resumes: initialResumes,
  recentSkillMaps,
  adaptedResumesCount: initialAdaptedCount,
}: DashboardClientProps) {
  const authUser = useAppSelector((s) => s.auth.user)
  const router = useRouter()
  const [resumes, setResumes] = useState(initialResumes)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [jobPosting, setJobPosting] = useState({
    description: "",
    jobLink: "",
    inputType: "paste" as "paste" | "link",
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lastRequestKey, setLastRequestKey] = useState<string | null>(null)
  const [shouldGenerateCoverLetter, setShouldGenerateCoverLetter] = useState(true)

  // Use Redux user name if available, fallback to props
  const displayName = authUser?.user_metadata?.full_name || user?.user_metadata?.full_name || "there"

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

  const updateCoverLetterPreference = (value: boolean) => {
    setShouldGenerateCoverLetter(value)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cvify:shouldGenerateCoverLetter", value ? "true" : "false")
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
    console.log("[Cover Letter] notifyCoverLetterResult called with:", result)

    if (!result) return

    if (result.warning) {
      toast.info(result.warning)
    }

    if (result.id) {
      console.log("[Cover Letter] Cover letter saved with ID:", result.id)
      toast.success("Cover letter generated and saved", {
        description: "Click to open and review.",
        action: {
          label: "Open",
          onClick: () => router.push(`/cover-letter/${result.id}`),
        },
      })
      return
    }

    console.log("[Cover Letter] No ID, attempting to copy to clipboard")
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
      action: {
        label: "Copy",
        onClick: () => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(result.content)
          }
        },
      },
    })
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

      // Generate cover letter AFTER resume adaptation using adapted content
      // Job data is now stored in database, so cover letter API will get it from there
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
          .catch((error: any) => {
            console.error("Cover letter generation error:", error)
            clearCoverLetterPending(result.id)
            toast.error("Cover letter request failed. Try again from the dashboard.")
          })
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("resume-editor-content", JSON.stringify(result.data))
      }

      setRequestKey(requestKey)
      toast.success(
        shouldGenerateCoverLetter ? "Resume adapted. Drafting cover letter in the background..." : "Resume adapted. Opening editor...",
      )
      router.push(`/resume-editor?id=${result.id}`)
    } catch (error: any) {
      const rawMessage =
        error && typeof error.message === "string"
          ? error.message
          : "Failed to analyze. Please try again."

      if (rawMessage.includes("keep up to 3 adapted resumes")) {
        console.info("Analysis limit reached:", rawMessage)
        setInputError(null)
        toast.error("Resume limit reached", {
          description: "You can keep up to 3 adapted resumes. Please delete one from the Resume Editor.",
          action: {
            label: "Open Editor",
            onClick: () => router.push("/resume-editor"),
          },
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

  const hasJobInfo =
    jobPosting.inputType === "paste" ? jobPosting.description.trim().length > 0 : jobPosting.jobLink.trim().length > 0
  const canAnalyze = (selectedResumeId || resumeText.trim().length > 0) && hasJobInfo

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
                textValue={resumeText}
                currentCount={resumes.length}
                maxResumes={3}
              />

              {resumes.length > 0 && (
                <div className="mt-6" id="resume-list-section">
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                    Or select from your uploaded resumes:
                  </h3>
                  <ResumeList
                    resumes={resumes}
                    selectedResumeId={selectedResumeId}
                    onSelectResume={handleSelectResume}
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
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Cover letter</p>
                  <p className="text-xs text-muted-foreground">
                    Generate a matching cover letter in the background. Saved when an uploaded resume is selected.
                  </p>
                </div>
                <Switch
                  checked={shouldGenerateCoverLetter}
                  onCheckedChange={updateCoverLetterPreference}
                  disabled={analyzing}
                  aria-label="Toggle cover letter generation"
                />
              </div>
              {shouldGenerateCoverLetter && !selectedResumeId && resumeText.trim().length > 0 && (
                <p className="text-xs text-muted-foreground mb-3">
                  We will copy the letter for you, but it will not be saved without an uploaded resume.
                </p>
              )}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6 min-w-0">
            {/* Recent Skill Maps */}
            <Card className="glass-card p-6 relative z-10 w-full">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Skill Analyses</h3>
              </div>
              <SkillMapList skillMaps={recentSkillMaps} />
            </Card>

            <Card className="glass-card-primary p-6 relative z-10 w-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Resume Editor</h3>
                  <p className="text-sm text-muted-foreground">
                    Edit and export your tailored resumes in one place.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-primary mt-1" />
              </div>
              <Button className="w-full mt-4" onClick={() => router.push("/resume-editor")}>
                Open Editor
              </Button>
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
                  <div className="text-3xl font-bold gradient-text">{recentSkillMaps.length}</div>
                  <div className="text-sm text-muted-foreground">Skill Analyses</div>
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
