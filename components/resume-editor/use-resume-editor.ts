"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { defaultResumeVariant } from "@/lib/resume-templates/variants"
import type { ResumeData } from "@/lib/resume-templates/types"
import type { ResumeVariantId } from "@/lib/resume-templates/variants"
import { MAX_ADAPTED_RESUMES } from "@/lib/constants"
import { useCoverLetter } from "@/hooks/use-cover-letter"
import { useSkillMap } from "@/hooks/use-skill-map"
import { useResumeExport } from "@/hooks/use-resume-export"
import type { SavedResume, ResumeEditorProps, UseResumeEditorReturn, ResumeMode } from "./types"

const EMPTY_RESUME: ResumeData = {
    personalInfo: {
        name: '',
        title: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        website: ''
    },
    sections: []
}

export function useResumeEditor({
    initialData,
    initialVariant = defaultResumeVariant,
    initialTheme = 'light',
    initialMode = null,
    resumeId = null,
    recentResumes = [],
}: ResumeEditorProps): UseResumeEditorReturn {
    const router = useRouter()

    // Core resume state
    const [resumeData, setResumeData] = useState<ResumeData>(initialData)
    const [baselineData, setBaselineData] = useState<ResumeData>(initialData)
    const [selectedVariant, setSelectedVariant] = useState<ResumeVariantId>(initialVariant)
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(initialTheme)
    const [activeResumeId, setActiveResumeId] = useState<string | null>(resumeId)
    const [activeResumeMode, setActiveResumeMode] = useState<ResumeMode | null>(initialMode ?? null)
    const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'skills'>('resume')

    // CRUD loading states
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Available resumes list
    const [availableResumes, setAvailableResumes] = useState<SavedResume[]>(
        () =>
            recentResumes.map((item) => ({
                ...item,
                variant: item.variant || defaultResumeVariant,
                theme: item.theme || 'light'
            }))
    )

    // Use extracted hooks
    const coverLetter = useCoverLetter({
        activeResumeId,
        activeTab,
    })

    const skillMap = useSkillMap({
        activeResumeId,
        activeTab,
    })

    const resumeExport = useResumeExport({
        resumeData,
        selectedVariant,
        themeMode,
        activeResumeId,
    })

    // Sync availableResumes when server props change (e.g., after navigation)
    const recentResumesKey = recentResumes.map(r => r.id).join(',')
    useEffect(() => {
        setAvailableResumes(prev => {
            const prevIds = prev.map(r => r.id).join(',')
            if (prevIds !== recentResumesKey) {
                return recentResumes.map((item) => ({
                    ...item,
                    variant: item.variant || defaultResumeVariant,
                    theme: item.theme || 'light'
                }))
            }
            return prev
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recentResumesKey])

    const upsertAvailableResume = useCallback((item: SavedResume, moveToTop = false) => {
        setAvailableResumes((prev) => {
            const existingIndex = item.id ? prev.findIndex((resume) => resume.id === item.id) : -1
            const existing = existingIndex >= 0 ? prev[existingIndex] : undefined
            const merged: SavedResume = {
                ...existing,
                ...item,
                variant: item.variant || existing?.variant || defaultResumeVariant,
                theme: item.theme || existing?.theme || 'light',
                mode: item.mode ?? existing?.mode ?? activeResumeMode ?? null,
            }

            if (existingIndex >= 0 && !moveToTop) {
                const next = [...prev]
                next[existingIndex] = merged
                return next
            }

            const filtered = item.id ? prev.filter((resume) => resume.id !== item.id) : prev
            const next = [merged, ...filtered]
            return next.slice(0, MAX_ADAPTED_RESUMES)
        })
    }, [activeResumeMode])

    const activeResumeLabel = useMemo(() => {
        if (activeResumeId) {
            const existing = availableResumes.find((resume) => resume.id === activeResumeId)
            if (existing?.fileName) return existing.fileName
            if (existing?.data?.personalInfo?.name) return existing.data.personalInfo.name
        }
        return resumeData.personalInfo.name || 'Resume'
    }, [activeResumeId, availableResumes, resumeData])

    const activeAtsScores = useMemo(() => {
        if (activeResumeId) {
            const existing = availableResumes.find((resume) => resume.id === activeResumeId)
            return {
                before: existing?.atsScoreBefore ?? null,
                after: existing?.atsScoreAfter ?? null,
            }
        }
        return { before: null, after: null }
    }, [activeResumeId, availableResumes])

    // Track unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        if (resumeData === baselineData) return false
        return JSON.stringify(resumeData) !== JSON.stringify(baselineData)
    }, [resumeData, baselineData])

    // Track if this is the first render to avoid saving on mount
    const isFirstRender = useRef(true)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastSavedSettingsRef = useRef<{ variant: string; theme: string } | null>(null)

    // Auto-save ONLY variant and theme settings when they change
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            lastSavedSettingsRef.current = { variant: selectedVariant, theme: themeMode }
            return
        }

        if (!activeResumeId) return

        const lastSettings = lastSavedSettingsRef.current
        if (lastSettings && lastSettings.variant === selectedVariant && lastSettings.theme === themeMode) {
            return
        }

        setAvailableResumes((prev) =>
            prev.map((resume) =>
                resume.id === activeResumeId
                    ? { ...resume, variant: selectedVariant, theme: themeMode }
                    : resume
            )
        )

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`/api/rewritten-resumes/${activeResumeId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variant: selectedVariant,
                        theme: themeMode,
                    })
                })

                if (response.ok) {
                    lastSavedSettingsRef.current = { variant: selectedVariant, theme: themeMode }
                } else {
                    console.error('Failed to auto-save template settings')
                }
            } catch (error) {
                console.error('Auto-save error:', error)
            }
        }, 500)

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [selectedVariant, themeMode, activeResumeId])

    // Update available resumes when active resume changes
    useEffect(() => {
        if (!activeResumeId) return
        if (availableResumes.some((resume) => resume.id === activeResumeId)) return

        upsertAvailableResume({
            id: activeResumeId,
            data: resumeData,
            variant: selectedVariant,
            theme: themeMode,
            fileName: resumeData.personalInfo.name || 'resume',
            mode: activeResumeMode ?? null,
        })
    }, [activeResumeId, activeResumeMode, availableResumes, resumeData, selectedVariant, themeMode, upsertAvailableResume])

    // Ensure we don't stay on job tabs when the active resume doesn't support them
    useEffect(() => {
        const supportsJobTabs = activeResumeMode === 'tailored' || activeResumeMode === null
        if (!supportsJobTabs && activeTab !== 'resume') {
            setActiveTab('resume')
        }
    }, [activeResumeMode, activeTab])

    const handleReset = useCallback(() => {
        setResumeData(baselineData)
        toast.success('Reset to last saved version')
    }, [baselineData])

    const handleSelectSaved = useCallback((item: SavedResume) => {
        setActiveResumeId(item.id)
        setResumeData(item.data)
        setBaselineData(item.data)
        setSelectedVariant(item.variant || defaultResumeVariant)
        setThemeMode(item.theme || 'light')
        setActiveResumeMode(item.mode ?? null)
        lastSavedSettingsRef.current = {
            variant: item.variant || defaultResumeVariant,
            theme: item.theme || 'light'
        }

        if (item.id) {
            router.replace(`/resume-editor?id=${item.id}`, { scroll: false })
        }

        const supportsJobTabs = item.mode === 'tailored' || item.mode === null || item.mode === undefined
        if (!supportsJobTabs) {
            setActiveTab('resume')
        }
    }, [router])

    const handleDeleteSaved = useCallback(async (id: string | null) => {
        if (!id) return
        setDeletingId(id)
        try {
            const response = await fetch(`/api/rewritten-resumes/${id}`, { method: 'DELETE' })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                const message = typeof data.error === 'string' ? data.error : 'Failed to delete resume'
                throw new Error(message)
            }

            const next = availableResumes.filter((resume) => resume.id !== id)
            setAvailableResumes(next)
            coverLetter.setCoverLettersByResume((prev) => {
                const updated = { ...prev }
                delete updated[id]
                return updated
            })

            if (activeResumeId === id) {
                const fallback = next[0]
                if (fallback) {
                    setActiveResumeId(fallback.id)
                    setResumeData(fallback.data)
                    setBaselineData(fallback.data)
                    setSelectedVariant(fallback.variant || defaultResumeVariant)
                    setThemeMode(fallback.theme || 'light')
                    setActiveResumeMode(fallback.mode ?? null)
                    lastSavedSettingsRef.current = {
                        variant: fallback.variant || defaultResumeVariant,
                        theme: fallback.theme || 'light'
                    }
                    router.replace(`/resume-editor?id=${fallback.id}`, { scroll: false })
                } else {
                    setActiveResumeId(null)
                    setResumeData(EMPTY_RESUME)
                    setBaselineData(EMPTY_RESUME)
                    setSelectedVariant(defaultResumeVariant)
                    setThemeMode('light')
                    setActiveResumeMode(null)
                    lastSavedSettingsRef.current = null
                    router.push('/dashboard')
                    return
                }
            }

            toast.success('Resume deleted')
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete resume')
        } finally {
            setDeletingId(null)
        }
    }, [activeResumeId, availableResumes, coverLetter, router])

    const handleSave = useCallback(async () => {
        setSaving(true)
        try {
            const payload = {
                structuredData: resumeData,
                variant: selectedVariant,
                theme: themeMode,
                fileName: resumeData.personalInfo.name || 'resume'
            }
            const endpoint = activeResumeId ? `/api/rewritten-resumes/${activeResumeId}` : '/api/rewritten-resumes'
            const method = activeResumeId ? 'PATCH' : 'POST'
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                const message = typeof data.error === 'string' ? data.error : 'Failed to save resume'
                throw new Error(message)
            }

            const item = (data.item || data) as Record<string, unknown>
            const mappedMode = (item.mode as SavedResume["mode"]) ?? activeResumeMode ?? null
            const mapped: SavedResume = {
                id: (item.id as string) || activeResumeId,
                data: resumeData,
                variant: (item.variant as ResumeVariantId) || selectedVariant,
                theme: (item.theme as 'light' | 'dark') || themeMode,
                mode: mappedMode,
                pdfUrl: (item.pdf_url || item.pdfUrl) as string | null || null,
                createdAt: (item.created_at || item.createdAt) as string | null || null,
                updatedAt: (item.updated_at || item.updatedAt) as string | null || null,
                fileName: (item.file_name || item.fileName || resumeData.personalInfo.name || 'resume') as string
            }

            if (!mapped.id) {
                throw new Error('Failed to save resume')
            }

            setActiveResumeId(mapped.id)
            setActiveResumeMode(mapped.mode ?? null)
            setBaselineData(resumeData)
            upsertAvailableResume(mapped, true)
            toast.success('Resume saved')
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save resume')
        } finally {
            setSaving(false)
        }
    }, [activeResumeId, activeResumeMode, resumeData, router, selectedVariant, themeMode, upsertAvailableResume])

    const handleExport = useCallback(async () => {
        const pdfUrl = await resumeExport.handleExport()
        if (pdfUrl && activeResumeId) {
            const current = availableResumes.find((resume) => resume.id === activeResumeId)
            upsertAvailableResume({
                ...(current || {
                    id: activeResumeId,
                    data: resumeData,
                    variant: selectedVariant,
                    theme: themeMode,
                    mode: activeResumeMode ?? null,
                }),
                id: activeResumeId,
                pdfUrl,
                fileName: (current?.fileName || resumeData.personalInfo.name || 'resume'),
                updatedAt: current?.updatedAt || null,
                createdAt: current?.createdAt || null,
                data: resumeData,
                variant: selectedVariant,
                theme: themeMode,
                mode: current?.mode ?? activeResumeMode ?? null,
            })
        }
    }, [activeResumeId, activeResumeMode, availableResumes, resumeData, resumeExport, selectedVariant, themeMode, upsertAvailableResume])

    const handleGenerateCoverLetter = useCallback(async () => {
        await coverLetter.handleGenerateCoverLetter()
        setActiveTab('cover')
    }, [coverLetter])

    const handleGenerateSkillMap = useCallback(async () => {
        await skillMap.handleGenerateSkillMap()
        setActiveTab('skills')
    }, [skillMap])

    return {
        // Core state
        resumeData,
        setResumeData,
        baselineData,
        selectedVariant,
        setSelectedVariant,
        themeMode,
        setThemeMode,
        activeResumeId,
        activeResumeMode,
        activeResumeLabel,
        activeAtsScoreBefore: activeAtsScores.before,
        activeAtsScoreAfter: activeAtsScores.after,
        availableResumes,
        hasUnsavedChanges,
        saving,
        exporting: resumeExport.exporting,
        deletingId,

        // Cover letter (from extracted hook)
        activeCoverLetters: coverLetter.activeCoverLetters,
        coverLetterLoading: coverLetter.coverLetterLoading,
        coverLetterError: coverLetter.coverLetterError,
        generatingCoverLetter: coverLetter.generatingCoverLetter,
        deletingCoverLetterId: coverLetter.deletingCoverLetterId,
        waitingForCoverLetter: coverLetter.waitingForCoverLetter,

        // Skill map (from extracted hook)
        activeSkillMaps: skillMap.activeSkillMaps,
        skillMapLoading: skillMap.skillMapLoading,
        skillMapError: skillMap.skillMapError,
        generatingSkillMap: skillMap.generatingSkillMap,
        deletingSkillMapId: skillMap.deletingSkillMapId,
        waitingForSkillMap: skillMap.waitingForSkillMap,

        // Tab state
        activeTab,
        setActiveTab,

        // Actions
        handleReset,
        handleSave,
        handleExport,
        handleSelectSaved,
        handleDeleteSaved,
        handleGenerateCoverLetter,
        handleDeleteCoverLetter: coverLetter.handleDeleteCoverLetter,
        handleReloadCoverLetters: coverLetter.handleReloadCoverLetters,
        handleUpdateCoverLetter: coverLetter.handleUpdateCoverLetter,
        handleGenerateSkillMap,
        handleDeleteSkillMap: skillMap.handleDeleteSkillMap,
        handleReloadSkillMaps: skillMap.handleReloadSkillMaps,
    }
}
