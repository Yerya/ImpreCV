"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { parseMarkdownToResumeData } from "@/lib/resume-parser-structured"
import { defaultResumeVariant } from "@/lib/resume-templates/variants"
import type { ResumeData } from "@/lib/resume-templates/types"
import type { ResumeVariantId } from "@/lib/resume-templates/variants"
import type { CoverLetter } from "@/components/resume-templates/cover-letter-panel"
import type { SkillMapRecord } from "@/types/skill-map"
import { generateCoverLetter, generateSkillMap } from "@/lib/api-client"
import { MAX_ADAPTED_RESUMES } from "@/lib/constants"
import {
    clearCoverLetterPending,
    isCoverLetterPending,
} from "@/lib/cover-letter-context"
import type { SavedResume, ResumeEditorProps, UseResumeEditorReturn, ResumeMode } from "./types"

const EDITOR_STORAGE_KEY = 'cvify:resume-editor-state'
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
    const [resumeData, setResumeData] = useState<ResumeData>(initialData)
    const [baselineData, setBaselineData] = useState<ResumeData>(initialData)
    const [selectedVariant, setSelectedVariant] = useState<ResumeVariantId>(initialVariant)
    const [exporting, setExporting] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(initialTheme)
    const [activeResumeId, setActiveResumeId] = useState<string | null>(resumeId)
    const [activeResumeMode, setActiveResumeMode] = useState<ResumeMode | null>(initialMode ?? null)
    const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'skills'>('resume')
    const [coverLettersByResume, setCoverLettersByResume] = useState<Record<string, CoverLetter[]>>({})
    const [coverLetterLoading, setCoverLetterLoading] = useState(false)
    const [coverLetterError, setCoverLetterError] = useState<string | null>(null)
    const coverLetterRequestRef = useRef<AbortController | null>(null)
    const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false)
    const [deletingCoverLetterId, setDeletingCoverLetterId] = useState<string | null>(null)
    const coverLetterPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const coverLetterPollStartRef = useRef<number | null>(null)
    const [generatingSkillMap, setGeneratingSkillMap] = useState(false)
    const [skillMapsByResume, setSkillMapsByResume] = useState<Record<string, SkillMapRecord[]>>({})
    const [skillMapLoading, setSkillMapLoading] = useState(false)
    const [skillMapError, setSkillMapError] = useState<string | null>(null)
    const skillMapRequestRef = useRef<AbortController | null>(null)
    const [deletingSkillMapId, setDeletingSkillMapId] = useState<string | null>(null)
    const [availableResumes, setAvailableResumes] = useState<SavedResume[]>(
        () =>
            recentResumes.map((item) => ({
                ...item,
                variant: item.variant || defaultResumeVariant,
                theme: item.theme || 'light'
            }))
    )

    const upsertAvailableResume = useCallback((item: SavedResume) => {
        setAvailableResumes((prev) => {
            const existing = item.id ? prev.find((resume) => resume.id === item.id) : undefined
            const merged: SavedResume = {
                ...existing,
                ...item,
                variant: item.variant || existing?.variant || defaultResumeVariant,
                theme: item.theme || existing?.theme || 'light',
                mode: item.mode ?? existing?.mode ?? activeResumeMode ?? null,
            }
            const filtered = item.id ? prev.filter((resume) => resume.id !== item.id) : prev
            const next = [merged, ...filtered]
            return next.slice(0, MAX_ADAPTED_RESUMES)
        })
    }, [activeResumeMode])

    const activeCoverLetters = activeResumeId ? coverLettersByResume[activeResumeId] || [] : []
    const activeSkillMaps = activeResumeId ? skillMapsByResume[activeResumeId] || [] : []
    const activeResumeLabel = useMemo(() => {
        if (activeResumeId) {
            const existing = availableResumes.find((resume) => resume.id === activeResumeId)
            if (existing?.fileName) return existing.fileName
            if (existing?.data?.personalInfo?.name) return existing.data.personalInfo.name
        }
        return resumeData.personalInfo.name || 'Resume'
    }, [activeResumeId, availableResumes, resumeData])
    const waitingForCoverLetter = activeTab === 'cover' && !!activeResumeId && !activeCoverLetters.length && (coverLetterLoading || generatingCoverLetter)
    const waitingForSkillMap = activeTab === 'skills' && !!activeResumeId && !activeSkillMaps.length && (skillMapLoading || generatingSkillMap)

    const loadSkillMaps = useCallback(
        async (resumeId: string, options?: { force?: boolean; silent?: boolean }) => {
            if (!resumeId) return
            if (!options?.force && skillMapsByResume[resumeId]) return

            skillMapRequestRef.current?.abort()
            const controller = new AbortController()
            skillMapRequestRef.current = controller
            if (!options?.silent) {
                setSkillMapLoading(true)
            }
            setSkillMapError(null)

            try {
                const response = await fetch(`/api/skill-map?rewrittenResumeId=${resumeId}`, { signal: controller.signal })
                const data = await response.json().catch(() => ({}))

                if (!response.ok) {
                    const message = typeof data?.error === 'string' ? data.error : 'Failed to load skill maps'
                    throw new Error(message)
                }

                if (controller.signal.aborted) return

                const dataObj = data as Record<string, unknown>
                const items = Array.isArray(dataObj.items) ? (dataObj.items as SkillMapRecord[]) : []
                setSkillMapsByResume((prev) => ({ ...prev, [resumeId]: items }))
            } catch (error) {
                if (controller.signal.aborted) return
                setSkillMapError(error instanceof Error ? error.message : 'Failed to load skill maps')
                if (options?.silent) {
                    setSkillMapLoading(false)
                }
            } finally {
                if (!controller.signal.aborted && !options?.silent) {
                    setSkillMapLoading(false)
                }
            }
        },
        [skillMapsByResume]
    )

    const loadCoverLetters = useCallback(
        async (resumeId: string, options?: { force?: boolean; silent?: boolean }) => {
            if (!resumeId) return
            if (!options?.force && coverLettersByResume[resumeId]) return

            coverLetterRequestRef.current?.abort()
            const controller = new AbortController()
            coverLetterRequestRef.current = controller
            if (!options?.silent) {
                setCoverLetterLoading(true)
            }
            setCoverLetterError(null)

            try {
                const response = await fetch(`/api/cover-letter?rewrittenResumeId=${resumeId}`, { signal: controller.signal })
                const data = await response.json().catch(() => ({}))

                if (!response.ok) {
                    const message = typeof data?.error === 'string' ? data.error : 'Failed to load cover letter'
                    throw new Error(message)
                }

                if (controller.signal.aborted) return

                const dataObj = data as Record<string, unknown>
                const items = Array.isArray(dataObj.items) ? (dataObj.items as CoverLetter[]) : []
                setCoverLettersByResume((prev) => ({ ...prev, [resumeId]: items }))
            } catch (error) {
                if (controller.signal.aborted) return
                setCoverLetterError(error instanceof Error ? error.message : 'Failed to load cover letter')
                if (options?.silent) {
                    setCoverLetterLoading(false)
                }
            } finally {
                if (!controller.signal.aborted && !options?.silent) {
                    setCoverLetterLoading(false)
                }
            }
        },
        [coverLettersByResume]
    )

    // Load initial state from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return

        const storedStateRaw = window.localStorage.getItem(EDITOR_STORAGE_KEY)
        const pendingContent = window.localStorage.getItem('resume-editor-content')?.trim()

        if (!availableResumes.length && !activeResumeId && pendingContent) {
            const parsedData = parseMarkdownToResumeData(pendingContent)
            setResumeData(parsedData)
            setBaselineData(parsedData)
            window.localStorage.removeItem('resume-editor-content')
            window.localStorage.setItem(
                EDITOR_STORAGE_KEY,
                JSON.stringify({ data: parsedData, variant: selectedVariant, theme: themeMode, resumeId: null })
            )
            return
        }

        if (storedStateRaw && !activeResumeId) {
            try {
                const storedState = JSON.parse(storedStateRaw) as {
                    data?: ResumeData
                    variant?: ResumeVariantId
                    theme?: 'light' | 'dark'
                    resumeId?: string | null
                }
                if (storedState?.data) {
                    setResumeData(storedState.data)
                    setBaselineData(storedState.data)
                    if (storedState.variant) setSelectedVariant(storedState.variant)
                    if (storedState.theme) setThemeMode(storedState.theme)
                    setActiveResumeId(storedState.resumeId || null)
                }
            } catch {
                // ignore corrupted state
            }
        }

        if (pendingContent) {
            window.localStorage.removeItem('resume-editor-content')
        }
    }, [])

    // Persist state to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(
            EDITOR_STORAGE_KEY,
            JSON.stringify({ data: resumeData, variant: selectedVariant, theme: themeMode, resumeId: activeResumeId })
        )
    }, [resumeData, selectedVariant, themeMode, activeResumeId])

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

    // Load cover letters when tab changes
    useEffect(() => {
        if (activeTab !== 'cover' || !activeResumeId) {
            setCoverLetterLoading(false)
            return
        }

        const hasLoaded = coverLettersByResume[activeResumeId] !== undefined
        if (activeTab === 'cover' && !hasLoaded) {
            setCoverLetterLoading(true)
            loadCoverLetters(activeResumeId, { force: true })
        }
    }, [activeResumeId, activeTab, coverLettersByResume, loadCoverLetters])

    // Load cover letters in background for chat panel
    useEffect(() => {
        if (!activeResumeId) return
        
        const hasLoaded = coverLettersByResume[activeResumeId] !== undefined
        if (!hasLoaded) {
            loadCoverLetters(activeResumeId, { silent: true })
        }
    }, [activeResumeId, coverLettersByResume, loadCoverLetters])

    // Load skill maps when tab changes
    useEffect(() => {
        if (activeTab !== 'skills' || !activeResumeId) {
            setSkillMapLoading(false)
            return
        }

        const hasLoaded = skillMapsByResume[activeResumeId] !== undefined
        if (!hasLoaded) {
            setSkillMapLoading(true)
            loadSkillMaps(activeResumeId, { force: true })
        }
    }, [activeResumeId, activeTab, skillMapsByResume, loadSkillMaps])

    // Clear errors when resume changes
    useEffect(() => {
        if (!activeResumeId) {
            setCoverLetterError(null)
            setCoverLetterLoading(false)
            setSkillMapError(null)
            setSkillMapLoading(false)
        }
    }, [activeResumeId])

    const stopCoverLetterPoll = useCallback(() => {
        if (coverLetterPollRef.current) {
            clearInterval(coverLetterPollRef.current)
            coverLetterPollRef.current = null
        }
        coverLetterPollStartRef.current = null
    }, [])

    const startCoverLetterPoll = useCallback(
        (resumeId: string) => {
            if (coverLetterPollRef.current) return
            coverLetterPollStartRef.current = Date.now()
            coverLetterPollRef.current = setInterval(() => {
                const elapsed = coverLetterPollStartRef.current ? Date.now() - coverLetterPollStartRef.current : 0
                if (elapsed > 45000) {
                    stopCoverLetterPoll()
                    setGeneratingCoverLetter(false)
                    setCoverLetterLoading(false)
                    clearCoverLetterPending(resumeId)
                    return
                }
                loadCoverLetters(resumeId, { force: true, silent: true })
            }, 3000)
        },
        [loadCoverLetters, stopCoverLetterPoll]
    )

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            coverLetterRequestRef.current?.abort()
            skillMapRequestRef.current?.abort()
            stopCoverLetterPoll()
        }
    }, [stopCoverLetterPoll])

    // Handle pending cover letter
    useEffect(() => {
        if (!activeResumeId) {
            stopCoverLetterPoll()
            return
        }

        if (isCoverLetterPending(activeResumeId)) {
            setGeneratingCoverLetter(true)
            setCoverLetterError(null)
            setCoverLetterLoading(true)
            loadCoverLetters(activeResumeId, { force: true, silent: true })
            startCoverLetterPoll(activeResumeId)
        }
    }, [activeResumeId, loadCoverLetters, startCoverLetterPoll, stopCoverLetterPoll])

    // Clear pending state when cover letters load
    useEffect(() => {
        if (!activeResumeId) return
        if (!activeCoverLetters.length) return

        clearCoverLetterPending(activeResumeId)
        stopCoverLetterPoll()
        setGeneratingCoverLetter(false)
        setCoverLetterLoading(false)
    }, [activeCoverLetters.length, activeResumeId, stopCoverLetterPoll])

    const handleReset = useCallback(() => {
        setResumeData(baselineData)
        toast.success('Reset to last saved version')
    }, [baselineData])

    const handleUpdateCoverLetter = useCallback((id: string, newContent: string) => {
        if (!activeResumeId) return
        setCoverLettersByResume((prev) => {
            const existing = prev[activeResumeId] || []
            return {
                ...prev,
                [activeResumeId]: existing.map((letter) =>
                    letter.id === id ? { ...letter, content: newContent } : letter
                )
            }
        })
        toast.success('Cover letter updated')
    }, [activeResumeId])

    const handleReloadCoverLetters = useCallback(() => {
        if (activeResumeId) {
            loadCoverLetters(activeResumeId, { force: true })
        }
    }, [activeResumeId, loadCoverLetters])

    const handleReloadSkillMaps = useCallback(() => {
        if (activeResumeId) {
            loadSkillMaps(activeResumeId, { force: true })
        }
    }, [activeResumeId, loadSkillMaps])

    const handleDeleteSkillMap = useCallback(async (id: string) => {
        if (!activeResumeId || !id) return
        setDeletingSkillMapId(id)
        setSkillMapError(null)
        try {
            const response = await fetch(`/api/skill-map/${id}`, { method: 'DELETE' })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                const message = typeof data.error === 'string' ? data.error : 'Failed to delete skill map'
                throw new Error(message)
            }

            setSkillMapsByResume((prev) => {
                const existing = prev[activeResumeId] || []
                return { ...prev, [activeResumeId]: existing.filter((sm) => sm.id !== id) }
            })
            toast.success('Skill map deleted')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete skill map')
        } finally {
            setDeletingSkillMapId(null)
        }
    }, [activeResumeId])

    const handleDeleteCoverLetter = useCallback(async (id: string) => {
        if (!activeResumeId || !id) return
        setDeletingCoverLetterId(id)
        setCoverLetterError(null)
        try {
            const response = await fetch(`/api/cover-letter/${id}`, { method: 'DELETE' })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                const message = typeof data.error === 'string' ? data.error : 'Failed to delete cover letter'
                throw new Error(message)
            }

            setCoverLettersByResume((prev) => {
                const existing = prev[activeResumeId] || []
                return { ...prev, [activeResumeId]: existing.filter((letter) => letter.id !== id) }
            })
            toast.success('Cover letter deleted')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete cover letter')
        } finally {
            setDeletingCoverLetterId(null)
        }
    }, [activeResumeId])

    const handleGenerateCoverLetter = useCallback(async () => {
        if (!activeResumeId) {
            toast.error('Save this resume first')
            return
        }

        setGeneratingCoverLetter(true)
        setCoverLetterError(null)
        setCoverLetterLoading(true)
        try {
            const result = await generateCoverLetter({
                rewrittenResumeId: activeResumeId,
            })

            const now = new Date().toISOString()
            const newLetter: CoverLetter = {
                id: result.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
                content: result.content,
                jobTitle: result.metadata?.title || null,
                jobCompany: result.metadata?.company || null,
                rewrittenResumeId: activeResumeId,
                createdAt: now,
                updatedAt: now
            }

            setCoverLettersByResume((prev) => {
                const existing = prev[activeResumeId] || []
                return { ...prev, [activeResumeId]: [newLetter, ...existing] }
            })
            setActiveTab('cover')
            toast.success('Cover letter ready')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate cover letter'
            setCoverLetterError(message)
            toast.error(message)
        } finally {
            setGeneratingCoverLetter(false)
            if (!activeCoverLetters.length) {
                setCoverLetterLoading(false)
            }
        }
    }, [activeResumeId, activeCoverLetters.length])

    const handleGenerateSkillMap = useCallback(async () => {
        if (!activeResumeId) {
            toast.error('Save this resume first')
            return
        }

        setGeneratingSkillMap(true)
        setSkillMapError(null)
        setSkillMapLoading(true)
        try {
            const result = await generateSkillMap({
                rewrittenResumeId: activeResumeId,
            })

            if (result.skillMap) {
                const newSkillMap: SkillMapRecord = {
                    id: result.skillMap.id,
                    user_id: result.skillMap.user_id,
                    resume_id: result.skillMap.resume_id,
                    rewritten_resume_id: result.skillMap.rewritten_resume_id,
                    match_score: result.skillMap.match_score,
                    adaptation_score: result.skillMap.adaptation_score,
                    data: result.skillMap.data,
                    job_title: result.skillMap.job_title,
                    job_company: result.skillMap.job_company,
                    created_at: result.skillMap.created_at,
                    updated_at: result.skillMap.updated_at
                }

                setSkillMapsByResume((prev) => {
                    const existing = prev[activeResumeId] || []
                    const filtered = existing.filter((sm) => sm.id !== newSkillMap.id)
                    return { ...prev, [activeResumeId]: [newSkillMap, ...filtered] }
                })
            }

            if (result.cached) {
                toast.info('Skill map already exists')
            } else {
                toast.success('Skill map generated!')
            }

            setActiveTab('skills')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate skill map'
            setSkillMapError(message)
            toast.error(message)
        } finally {
            setGeneratingSkillMap(false)
            if (!activeSkillMaps.length) {
                setSkillMapLoading(false)
            }
        }
    }, [activeResumeId, activeSkillMaps.length])

    const handleSelectSaved = useCallback((item: SavedResume) => {
        setActiveResumeId(item.id)
        setResumeData(item.data)
        setBaselineData(item.data)
        setSelectedVariant(item.variant || defaultResumeVariant)
        setThemeMode(item.theme || 'light')
        setActiveResumeMode(item.mode ?? null)
        
        // Reset to resume tab if switching to a resume that doesn't support job-related tabs
        const supportsJobTabs = item.mode === 'tailored' || item.mode === null || item.mode === undefined
        if (!supportsJobTabs) {
            setActiveTab('resume')
        }
    }, [])

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
            setCoverLettersByResume((prev) => {
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
                } else {
                    setActiveResumeId(null)
                    setResumeData(EMPTY_RESUME)
                    setBaselineData(EMPTY_RESUME)
                    setSelectedVariant(defaultResumeVariant)
                    setThemeMode('light')
                }
            }

            toast.success('Resume deleted')
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete resume')
        } finally {
            setDeletingId(null)
        }
    }, [activeResumeId, availableResumes, router])

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
            upsertAvailableResume(mapped)
            toast.success('Resume saved')
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save resume')
        } finally {
            setSaving(false)
        }
    }, [activeResumeId, resumeData, router, selectedVariant, themeMode, upsertAvailableResume])

    const handleExport = useCallback(async () => {
        setExporting(true)
        try {
            const response = await fetch('/api/export-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: resumeData,
                    templateId: selectedVariant,
                    format: 'pdf',
                    themeConfig: { mode: themeMode },
                    resumeId: activeResumeId,
                    fileName: resumeData.personalInfo.name || 'resume'
                })
            })

            if (!response.ok) {
                let errorMessage = 'Failed to export resume'
                let errorDetails: { error?: string } = {}

                try {
                    const contentType = response.headers.get('content-type')

                    if (contentType?.includes('application/json')) {
                        errorDetails = await response.json()
                        errorMessage = errorDetails.error || errorMessage
                    } else {
                        const textError = await response.text()
                        errorMessage = textError || errorMessage
                    }
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError)
                }

                throw new Error(errorMessage)
            }

            const blob = await response.blob()

            if (blob.size === 0) throw new Error('Generated PDF is empty')

            const suggestedName = (resumeData.personalInfo.name || 'resume').replace(/\s+/g, '-').toLowerCase()
            const downloadName = response.headers.get('x-export-name') || `resume-${suggestedName}.pdf`

            const url = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = downloadName
            document.body.appendChild(anchor)
            anchor.click()
            document.body.removeChild(anchor)
            URL.revokeObjectURL(url)

            const pdfUrl = response.headers.get('x-export-url')
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

            toast.success('PDF ready')
        } catch (error) {
            console.error('PDF export error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to export resume')
        } finally {
            setExporting(false)
        }
    }, [activeResumeId, availableResumes, resumeData, selectedVariant, themeMode, upsertAvailableResume])

    return {
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
        availableResumes,
        saving,
        exporting,
        deletingId,
        activeCoverLetters,
        coverLetterLoading,
        coverLetterError,
        generatingCoverLetter,
        deletingCoverLetterId,
        waitingForCoverLetter,
        activeSkillMaps,
        skillMapLoading,
        skillMapError,
        generatingSkillMap,
        deletingSkillMapId,
        waitingForSkillMap,
        activeTab,
        setActiveTab,
        handleReset,
        handleSave,
        handleExport,
        handleSelectSaved,
        handleDeleteSaved,
        handleGenerateCoverLetter,
        handleDeleteCoverLetter,
        handleReloadCoverLetters,
        handleUpdateCoverLetter,
        handleGenerateSkillMap,
        handleDeleteSkillMap,
        handleReloadSkillMaps,
    }
}
