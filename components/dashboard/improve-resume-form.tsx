"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react"
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
    { id: "ats", label: "ATS Optimization", description: "Improve keyword matching for applicant tracking systems" },
    { id: "bullets", label: "Stronger Bullet Points", description: "Add metrics and action verbs to achievements" },
    { id: "formatting", label: "Professional Formatting", description: "Clean up structure and consistency" },
    { id: "summary", label: "Better Summary", description: "Write a more compelling professional summary" },
    { id: "keywords", label: "Industry Keywords", description: "Add relevant industry terminology" },
    { id: "clarity", label: "Improved Clarity", description: "Remove jargon and improve readability" },
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
        }
        setIsHydrated(true)
    }, [])

    // Save to localStorage on change (debounced)
    useEffect(() => {
        if (!isHydrated) return
        const timeout = setTimeout(() => {
            saveToStorage({ targetRole, selectedImprovements, resumeText })
        }, 500)
        return () => clearTimeout(timeout)
    }, [targetRole, selectedImprovements, resumeText, isHydrated])

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

    const hasResume = selectedResumeId || resumeText.trim().length > 0
    const canSubmit = hasResume && selectedImprovements.length > 0

    return (
        <div className="space-y-6">
            {/* Step 1: Resume Input */}
            <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                        1
                    </div>
                    <h2 className="text-xl font-bold">Your Resume</h2>
                    {hasResume && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                </div>

                <ResumeUpload
                    onResumeUploaded={handleResumeUploaded}
                    onTextChange={handleTextChange}
                    textValue={resumeText}
                    currentCount={resumes.length}
                    maxResumes={MAX_RESUMES_PER_USER}
                />

                {resumes.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                            Or select from your uploaded resumes:
                        </h3>
                        <ResumeList
                            resumes={resumes}
                            selectedResumeId={selectedResumeId}
                            onSelectResume={handleSelectResume}
                            onDeleteResume={onDeleteResume}
                            deletingId={deletingId}
                        />
                    </div>
                )}
            </Card>

            {/* Step 2: Target Role (Optional) */}
            <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                        2
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Target Role</h2>
                        <p className="text-sm text-muted-foreground">Optional - helps AI optimize for your goals</p>
                    </div>
                </div>
                <Input
                    placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                />
            </Card>

            {/* Step 3: Improvement Options */}
            <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                        3
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Improvements</h2>
                        <p className="text-sm text-muted-foreground">Select what to focus on</p>
                    </div>
                    {selectedImprovements.length > 0 && (
                        <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {IMPROVEMENT_OPTIONS.map((option) => (
                        <label
                            key={option.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedImprovements.includes(option.id)
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
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
            </Card>

            {/* Submit Button */}
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

            {!hasResume && (
                <p className="text-sm text-muted-foreground text-center">
                    Please upload or paste your resume to continue
                </p>
            )}
        </div>
    )
}
