"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Sparkles } from "lucide-react"
import { WizardFlow } from "./workflow-stepper"
import ResumeUpload from "./resume-upload"
import ResumeList from "./resume-list"
import type { ImproveResumePayload } from "@/lib/api-client"
import { MAX_RESUMES_PER_USER } from "@/lib/constants"

const STORAGE_KEY = "cvify:improve-resume-form"
const STORAGE_EXPIRY_HOURS = 24

interface StoredFormData {
    targetRole: string
    selectedImprovements: string[]
    resumeText: string
    selectedResumeId: string | null
    timestamp: number
}

function loadFromStorage(): Partial<StoredFormData> | null {
    if (typeof window === "undefined") return null
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return null
        const parsed: StoredFormData = JSON.parse(stored)
        const hoursSinceStored = (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
        if (hoursSinceStored > STORAGE_EXPIRY_HOURS) {
            localStorage.removeItem(STORAGE_KEY)
            return null
        }
        return parsed
    } catch {
        return null
    }
}

function saveToStorage(data: Omit<StoredFormData, "timestamp">): void {
    if (typeof window === "undefined") return
    try {
        const toStore: StoredFormData = { ...data, timestamp: Date.now() }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch {
        // Ignore storage errors
    }
}

function clearStorage(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
}

interface ResumeRecord {
    id: string
    file_name: string
    created_at: string
    [key: string]: unknown
}

interface ImproveResumeFormProps {
    resumes: ResumeRecord[]
    onResumeUploaded: (resume: ResumeRecord) => void
    onDeleteResume: (id: string) => void
    deletingId: string | null
    onSubmit: (data: ImproveResumePayload) => Promise<void>
    isSubmitting: boolean
}

const IMPROVEMENT_OPTIONS = [
    { id: "ats", label: "ATS Optimization", description: "Improve keyword matching" },
    { id: "bullets", label: "Stronger Bullets", description: "Add metrics and action verbs" },
    { id: "formatting", label: "Formatting", description: "Clean up structure" },
    { id: "summary", label: "Better Summary", description: "More compelling summary" },
    { id: "keywords", label: "Keywords", description: "Add industry terms" },
    { id: "clarity", label: "Clarity", description: "Remove jargon" },
]

export function ImproveResumeForm({
    resumes,
    onResumeUploaded,
    onDeleteResume,
    deletingId,
    onSubmit,
    isSubmitting,
}: ImproveResumeFormProps) {
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
    const [resumeText, setResumeText] = useState("")
    const [targetRole, setTargetRole] = useState("")
    const [selectedImprovements, setSelectedImprovements] = useState<string[]>([
        "ats",
        "bullets",
        "formatting",
    ])
    const [isHydrated, setIsHydrated] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const stored = loadFromStorage()
        if (stored) {
            if (stored.targetRole) setTargetRole(stored.targetRole)
            if (stored.selectedImprovements) setSelectedImprovements(stored.selectedImprovements)
            if (stored.resumeText) setResumeText(stored.resumeText)
            if (stored.selectedResumeId) setSelectedResumeId(stored.selectedResumeId)
        }
        setIsHydrated(true)
    }, [])

    // Save to localStorage on change (debounced)
    useEffect(() => {
        if (!isHydrated) return
        const timeout = setTimeout(() => {
            saveToStorage({ targetRole, selectedImprovements, resumeText, selectedResumeId })
        }, 500)
        return () => clearTimeout(timeout)
    }, [targetRole, selectedImprovements, resumeText, selectedResumeId, isHydrated])

    const handleResumeUploaded = (resume: ResumeRecord) => {
        onResumeUploaded(resume)
        setSelectedResumeId(resume.id)
        setResumeText("")
    }

    const handleTextChange = (text: string) => {
        setResumeText(text)
        if (text) {
            setSelectedResumeId(null)
        }
    }

    const handleSelectResume = (id: string) => {
        setSelectedResumeId(id)
        setResumeText("")
    }

    const toggleImprovement = (id: string) => {
        setSelectedImprovements((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }

    const handleSubmit = async () => {
        const improvementLabels = selectedImprovements.map(
            (id) => IMPROVEMENT_OPTIONS.find((opt) => opt.id === id)?.label || id
        )

        await onSubmit({
            resumeId: selectedResumeId || undefined,
            resumeText: resumeText || undefined,
            targetRole: targetRole || undefined,
            improvements: improvementLabels,
        })

        // Clear storage after successful submission
        clearStorage()
    }

    const hasResume = !!(selectedResumeId || resumeText.trim().length > 0)
    const canSubmit = hasResume && selectedImprovements.length > 0

    return (
        <WizardFlow
            steps={[
                {
                    id: "resume",
                    label: "Your Resume",
                    isComplete: hasResume,
                    hint: resumes.length > 0
                        ? "Select a resume from the list or upload a new one"
                        : "Upload or paste your resume",
                    content: (
                        <div className="space-y-4">
                            <ResumeUpload
                                onResumeUploaded={handleResumeUploaded}
                                onTextChange={handleTextChange}
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
                                        onDeleteResume={onDeleteResume}
                                        deletingId={deletingId}
                                    />
                                </div>
                            )}
                        </div>
                    ),
                },
                {
                    id: "options",
                    label: "Improvements",
                    isComplete: selectedImprovements.length > 0,
                    content: (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {IMPROVEMENT_OPTIONS.map((option) => (
                                <label
                                    key={option.id}
                                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedImprovements.includes(option.id)
                                        ? "border-[var(--gradient-2)] bg-[var(--gradient-2)]/5"
                                        : "border-border hover:border-[var(--gradient-2)]/50"
                                        }`}
                                >
                                    <Checkbox
                                        checked={selectedImprovements.includes(option.id)}
                                        onCheckedChange={() => toggleImprovement(option.id)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="font-medium text-sm">{option.label}</div>
                                        <div className="text-xs text-muted-foreground">{option.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ),
                },
                {
                    id: "role",
                    label: "Target Role",
                    isComplete: targetRole.trim().length > 0, // Show checkmark only when filled
                    isOptional: true,
                    content: (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Optional — helps AI optimize for your goals
                            </p>
                            <Input
                                placeholder="e.g., Senior Software Engineer"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                            />
                        </div>
                    ),
                },
            ]}
            completeButton={
                <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    size="lg"
                    className="w-full"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Improving Resume...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Improve Resume with AI
                        </>
                    )}
                </Button>
            }
        />
    )
}
