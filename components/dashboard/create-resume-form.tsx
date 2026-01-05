"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Loader2, Plus, Trash2, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreateResumePayload, CreateResumeExperience, CreateResumeEducation } from "@/lib/api-client"

const STORAGE_KEY = "cvify:create-resume-form"
const STORAGE_EXPIRY_HOURS = 24

interface StoredFormData {
    data: CreateResumePayload
    timestamp: number
}

function loadFromStorage(): CreateResumePayload | null {
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
        return parsed.data
    } catch {
        return null
    }
}

function saveToStorage(data: CreateResumePayload): void {
    if (typeof window === "undefined") return
    try {
        const toStore: StoredFormData = { data, timestamp: Date.now() }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch {
        // Ignore storage errors
    }
}

function clearStorage(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
}

interface CreateResumeFormProps {
    onSubmit: (data: CreateResumePayload) => Promise<void>
    isSubmitting: boolean
}

const DEFAULT_FORM_DATA: CreateResumePayload = {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    targetRole: "",
    yearsOfExperience: "",
    experience: [],
    education: [],
    skills: "",
    certifications: "",
    languages: "",
    additionalInfo: "",
}

export function CreateResumeForm({ onSubmit, isSubmitting }: CreateResumeFormProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        personal: true,
        experience: false,
        education: false,
        skills: false,
    })

    const [formData, setFormData] = useState<CreateResumePayload>(DEFAULT_FORM_DATA)
    const [isHydrated, setIsHydrated] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const stored = loadFromStorage()
        if (stored) {
            setFormData(stored)
        }
        setIsHydrated(true)
    }, [])

    // Save to localStorage on change (debounced)
    useEffect(() => {
        if (!isHydrated) return
        const timeout = setTimeout(() => {
            saveToStorage(formData)
        }, 500)
        return () => clearTimeout(timeout)
    }, [formData, isHydrated])

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
    }

    const updateField = <K extends keyof CreateResumePayload>(field: K, value: CreateResumePayload[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const addExperience = () => {
        const newExp: CreateResumeExperience = {
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            responsibilities: "",
        }
        updateField("experience", [...(formData.experience || []), newExp])
    }

    const updateExperience = (index: number, field: keyof CreateResumeExperience, value: string | boolean) => {
        const updated = [...(formData.experience || [])]
        updated[index] = { ...updated[index], [field]: value }
        updateField("experience", updated)
    }

    const removeExperience = (index: number) => {
        const updated = (formData.experience || []).filter((_, i) => i !== index)
        updateField("experience", updated)
    }

    const addEducation = () => {
        const newEdu: CreateResumeEducation = {
            degree: "",
            institution: "",
            location: "",
            graduationDate: "",
            gpa: "",
        }
        updateField("education", [...(formData.education || []), newEdu])
    }

    const updateEducation = (index: number, field: keyof CreateResumeEducation, value: string) => {
        const updated = [...(formData.education || [])]
        updated[index] = { ...updated[index], [field]: value }
        updateField("education", updated)
    }

    const removeEducation = (index: number) => {
        const updated = (formData.education || []).filter((_, i) => i !== index)
        updateField("education", updated)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
        // Clear storage after successful submission
        clearStorage()
    }

    const isValid = formData.fullName.trim().length > 0 && formData.targetRole.trim().length > 0

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information Section */}
            <Card className="glass-card overflow-hidden !py-0 !gap-0">
                <button
                    type="button"
                    className={cn(
                        "w-full flex items-center justify-between p-4 text-left transition-colors",
                        expandedSections.personal
                            ? "bg-foreground/5 hover:bg-foreground/5 border-b border-border/30"
                            : "hover:bg-foreground/5"
                    )}
                    onClick={() => toggleSection("personal")}
                >
                    <div>
                        <h3 className="font-semibold">Personal Information</h3>
                        <p className="text-sm text-muted-foreground">Basic contact details</p>
                    </div>
                    {expandedSections.personal ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                </button>
                {expandedSections.personal && (
                    <div className="p-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">
                                    Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="fullName"
                                    placeholder="Your name"
                                    value={formData.fullName}
                                    onChange={(e) => updateField("fullName", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetRole">
                                    Target Role <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="targetRole"
                                    placeholder="Software Engineer"
                                    value={formData.targetRole}
                                    onChange={(e) => updateField("targetRole", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    placeholder="+1 (555) 123-4567"
                                    value={formData.phone}
                                    onChange={(e) => updateField("phone", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    placeholder="San Francisco, CA"
                                    value={formData.location}
                                    onChange={(e) => updateField("location", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                                <Input
                                    id="yearsOfExperience"
                                    placeholder="5+ years"
                                    value={formData.yearsOfExperience}
                                    onChange={(e) => updateField("yearsOfExperience", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn</Label>
                                <Input
                                    id="linkedin"
                                    placeholder="linkedin.com/in/yourname"
                                    value={formData.linkedin}
                                    onChange={(e) => updateField("linkedin", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    placeholder="yourwebsite.com"
                                    value={formData.website}
                                    onChange={(e) => updateField("website", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Experience Section */}
            <Card className="glass-card overflow-hidden !py-0 !gap-0">
                <button
                    type="button"
                    className={cn(
                        "w-full flex items-center justify-between p-4 text-left transition-colors",
                        expandedSections.experience
                            ? "bg-foreground/5 hover:bg-foreground/5 border-b border-border/30"
                            : "hover:bg-foreground/5"
                    )}
                    onClick={() => toggleSection("experience")}
                >
                    <div>
                        <h3 className="font-semibold">Work Experience</h3>
                        <p className="text-sm text-muted-foreground">
                            {(formData.experience?.length || 0) > 0
                                ? `${formData.experience?.length} position(s) added`
                                : "Optional - add your work history"}
                        </p>
                    </div>
                    {expandedSections.experience ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                </button>
                {expandedSections.experience && (
                    <div className="p-4 space-y-4">
                        {formData.experience?.map((exp, index) => (
                            <Card key={index} className="p-4 bg-muted/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Position {index + 1}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => removeExperience(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Input
                                        placeholder="Job Title"
                                        value={exp.title}
                                        onChange={(e) => updateExperience(index, "title", e.target.value)}
                                    />
                                    <Input
                                        placeholder="Company Name"
                                        value={exp.company}
                                        onChange={(e) => updateExperience(index, "company", e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <Input
                                        placeholder="Location"
                                        value={exp.location}
                                        onChange={(e) => updateExperience(index, "location", e.target.value)}
                                    />
                                    <Input
                                        placeholder="Start Date (e.g., Jan 2020)"
                                        value={exp.startDate}
                                        onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                                    />
                                    <Input
                                        placeholder="End Date or Present"
                                        value={exp.endDate}
                                        onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                                    />
                                </div>
                                <Textarea
                                    placeholder="Key responsibilities and achievements (AI will enhance these)"
                                    value={exp.responsibilities}
                                    onChange={(e) => updateExperience(index, "responsibilities", e.target.value)}
                                    rows={3}
                                />
                            </Card>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={addExperience}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Experience
                        </Button>
                    </div>
                )}
            </Card>

            {/* Education Section */}
            <Card className="glass-card overflow-hidden !py-0 !gap-0">
                <button
                    type="button"
                    className={cn(
                        "w-full flex items-center justify-between p-4 text-left transition-colors",
                        expandedSections.education
                            ? "bg-foreground/5 hover:bg-foreground/5 border-b border-border/30"
                            : "hover:bg-foreground/5"
                    )}
                    onClick={() => toggleSection("education")}
                >
                    <div>
                        <h3 className="font-semibold">Education</h3>
                        <p className="text-sm text-muted-foreground">
                            {(formData.education?.length || 0) > 0
                                ? `${formData.education?.length} degree(s) added`
                                : "Optional - add your education"}
                        </p>
                    </div>
                    {expandedSections.education ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                </button>
                {expandedSections.education && (
                    <div className="p-4 space-y-4">
                        {formData.education?.map((edu, index) => (
                            <Card key={index} className="p-4 bg-muted/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Degree {index + 1}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => removeEducation(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Input
                                        placeholder="Degree (e.g., Bachelor of Science)"
                                        value={edu.degree}
                                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                                    />
                                    <Input
                                        placeholder="Institution Name"
                                        value={edu.institution}
                                        onChange={(e) => updateEducation(index, "institution", e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <Input
                                        placeholder="Location"
                                        value={edu.location}
                                        onChange={(e) => updateEducation(index, "location", e.target.value)}
                                    />
                                    <Input
                                        placeholder="Graduation Date"
                                        value={edu.graduationDate}
                                        onChange={(e) => updateEducation(index, "graduationDate", e.target.value)}
                                    />
                                    <Input
                                        placeholder="GPA (optional)"
                                        value={edu.gpa}
                                        onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                                    />
                                </div>
                            </Card>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={addEducation}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Education
                        </Button>
                    </div>
                )}
            </Card>

            {/* Skills & Other Section */}
            <Card className="glass-card overflow-hidden !py-0 !gap-0">
                <button
                    type="button"
                    className={cn(
                        "w-full flex items-center justify-between p-4 text-left transition-colors",
                        expandedSections.skills
                            ? "bg-foreground/5 hover:bg-foreground/5 border-b border-border/30"
                            : "hover:bg-foreground/5"
                    )}
                    onClick={() => toggleSection("skills")}
                >
                    <div>
                        <h3 className="font-semibold">Skills & Additional Info</h3>
                        <p className="text-sm text-muted-foreground">Skills, certifications, languages</p>
                    </div>
                    {expandedSections.skills ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                </button>
                {expandedSections.skills && (
                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="skills">Skills</Label>
                            <Textarea
                                id="skills"
                                placeholder="Python, JavaScript, React, SQL, AWS, Machine Learning, etc."
                                value={formData.skills}
                                onChange={(e) => updateField("skills", e.target.value)}
                                rows={2}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty and AI will infer relevant skills from your experience
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="certifications">Certifications</Label>
                            <Input
                                id="certifications"
                                placeholder="AWS Solutions Architect, PMP, etc."
                                value={formData.certifications}
                                onChange={(e) => updateField("certifications", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="languages">Languages</Label>
                            <Input
                                id="languages"
                                placeholder="English (Native), Spanish (Fluent)"
                                value={formData.languages}
                                onChange={(e) => updateField("languages", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="additionalInfo">Additional Information</Label>
                            <Textarea
                                id="additionalInfo"
                                placeholder="Any other relevant information, achievements, or notes for AI"
                                value={formData.additionalInfo}
                                onChange={(e) => updateField("additionalInfo", e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                )}
            </Card>

            <Button type="submit" disabled={!isValid || isSubmitting} size="lg" className="w-full">
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Resume...
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Create Resume with AI
                    </>
                )}
            </Button>
        </form>
    )
}
