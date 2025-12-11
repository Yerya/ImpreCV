"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalHeader } from "@/components/global-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Download, RefreshCw, Save, Loader2, Trash2 } from "lucide-react"
import { parseMarkdownToResumeData } from "@/lib/resume-parser-structured"
import { defaultResumeVariant, getVariantById, resumeVariants } from "@/lib/resume-templates/variants"
import type { ResumeData } from "@/lib/resume-templates/types"
import type { ResumeVariantId } from "@/lib/resume-templates/variants"
import { CoverLetterPanel, type CoverLetter } from "./cover-letter-panel"
import { SkillMapPanel } from "./skill-map-panel"
import { generateCoverLetter, generateSkillMap } from "@/lib/api-client"
import { WebResumeRenderer } from "./web-renderer"
import {
    clearCoverLetterPending,
    isCoverLetterPending,
} from "@/lib/cover-letter-context"
import type { SkillMapRecord } from "@/types/skill-map"
import { ResumeChatPanel } from "@/components/chat/resume-chat-panel"

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

interface SavedResume {
    id: string | null
    data: ResumeData
    variant: ResumeVariantId
    theme: 'light' | 'dark'
    pdfUrl?: string | null
    createdAt?: string | null
    updatedAt?: string | null
    fileName?: string | null
}

interface ResumeEditorProps {
    initialData: ResumeData
    initialVariant?: ResumeVariantId
    initialTheme?: 'light' | 'dark'
    resumeId?: string | null
    recentResumes?: SavedResume[]
    backHref?: string
}

export function ResumeEditor({
    initialData,
    initialVariant = defaultResumeVariant,
    initialTheme = 'light',
    resumeId = null,
    recentResumes = [],
    backHref = '/dashboard'
}: ResumeEditorProps) {
    const router = useRouter()
    const [resumeData, setResumeData] = useState<ResumeData>(initialData)
    const [baselineData, setBaselineData] = useState<ResumeData>(initialData)
    const [selectedVariant, setSelectedVariant] = useState<ResumeVariantId>(initialVariant)
    const [exporting, setExporting] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(initialTheme)
    const [activeResumeId, setActiveResumeId] = useState<string | null>(resumeId)
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
            const filtered = item.id ? prev.filter((resume) => resume.id !== item.id) : prev
            const next = [item, ...filtered]
            return next.slice(0, 3)
        })
    }, [])

    const variantMeta = getVariantById(selectedVariant)
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

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(
            EDITOR_STORAGE_KEY,
            JSON.stringify({ data: resumeData, variant: selectedVariant, theme: themeMode, resumeId: activeResumeId })
        )
    }, [resumeData, selectedVariant, themeMode, activeResumeId])

    useEffect(() => {
        if (!activeResumeId) return
        if (availableResumes.some((resume) => resume.id === activeResumeId)) return

        upsertAvailableResume({
            id: activeResumeId,
            data: resumeData,
            variant: selectedVariant,
            theme: themeMode,
            fileName: resumeData.personalInfo.name || 'resume'
        })
    }, [activeResumeId, availableResumes, resumeData, selectedVariant, themeMode, upsertAvailableResume])

    useEffect(() => {
        if (activeTab !== 'cover' || !activeResumeId) {
            setCoverLetterLoading(false)
            return
        }

        // Show loading indicator only when on cover tab
        const hasLoaded = coverLettersByResume[activeResumeId] !== undefined
        if (activeTab === 'cover' && !hasLoaded) {
            setCoverLetterLoading(true)
            loadCoverLetters(activeResumeId, { force: true })
        }
    }, [activeResumeId, activeTab, coverLettersByResume, loadCoverLetters])

    // Load cover letters in background for chat panel (regardless of active tab)
    useEffect(() => {
        if (!activeResumeId) return
        
        const hasLoaded = coverLettersByResume[activeResumeId] !== undefined
        if (!hasLoaded) {
            loadCoverLetters(activeResumeId, { silent: true })
        }
    }, [activeResumeId, coverLettersByResume, loadCoverLetters])

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

    useEffect(() => {
        return () => {
            coverLetterRequestRef.current?.abort()
            skillMapRequestRef.current?.abort()
            stopCoverLetterPoll()
        }
    }, [stopCoverLetterPoll])

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

    useEffect(() => {
        if (!activeResumeId) return
        if (!activeCoverLetters.length) return

        clearCoverLetterPending(activeResumeId)
        stopCoverLetterPoll()
        setGeneratingCoverLetter(false)
        setCoverLetterLoading(false)
    }, [activeCoverLetters.length, activeResumeId, stopCoverLetterPoll])
    const handleReset = () => {
        setResumeData(baselineData)
        toast.success('Reset to last saved version')
    }

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

    const handleReloadCoverLetters = () => {
        if (activeResumeId) {
            loadCoverLetters(activeResumeId, { force: true })
        }
    }

    const handleReloadSkillMaps = () => {
        if (activeResumeId) {
            loadSkillMaps(activeResumeId, { force: true })
        }
    }

    const handleDeleteSkillMap = async (id: string) => {
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
    }

    const handleDeleteCoverLetter = async (id: string) => {
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
    }

    const handleGenerateCoverLetter = async () => {
        if (!activeResumeId) {
            toast.error('Save this resume first')
            return
        }

        setGeneratingCoverLetter(true)
        setCoverLetterError(null)
        setCoverLetterLoading(true)
        try {
            // Job data is now stored in database, no need to pass from client
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
    }

    const handleGenerateSkillMap = async () => {
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
    }

    const handleSelectSaved = (item: SavedResume) => {
        setActiveResumeId(item.id)
        setResumeData(item.data)
        setBaselineData(item.data)
        setSelectedVariant(item.variant || defaultResumeVariant)
        setThemeMode(item.theme || 'light')
    }

    const handleDeleteSaved = async (id: string | null) => {
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
    }

    const handleSave = async () => {
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
            const mapped: SavedResume = {
                id: item.id || activeResumeId,
                data: resumeData,
                variant: item.variant || selectedVariant,
                theme: item.theme || themeMode,
                pdfUrl: item.pdf_url || item.pdfUrl || null,
                createdAt: item.created_at || item.createdAt || null,
                updatedAt: item.updated_at || item.updatedAt || null,
                fileName: item.file_name || item.fileName || resumeData.personalInfo.name || 'resume'
            }

            if (!mapped.id) {
                throw new Error('Failed to save resume')
            }

            setActiveResumeId(mapped.id)
            setBaselineData(resumeData)
            upsertAvailableResume(mapped)
            toast.success('Resume saved')
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save resume')
        } finally {
            setSaving(false)
        }
    }

    const handleExport = async () => {
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
                        theme: themeMode
                    }),
                    id: activeResumeId,
                    pdfUrl,
                    fileName: (current?.fileName || resumeData.personalInfo.name || 'resume'),
                    updatedAt: current?.updatedAt || null,
                    createdAt: current?.createdAt || null,
                    data: resumeData,
                    variant: selectedVariant,
                    theme: themeMode
                })
            }

            toast.success('PDF ready')
        } catch (error) {
            console.error('PDF export error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to export resume')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="min-h-screen relative pb-20">
            <GlobalHeader variant="back" backHref={backHref} backLabel="Back" />

            <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 gradient-text">Tailor Your Resume</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Click directly on the resume to edit. What you see is exactly what you export.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-2">
                            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {exporting ? 'Exporting...' : 'Export PDF'}
                        </Button>
                    </div>
                </div>

                <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start justify-items-center xl:justify-items-start">
                    <div className="w-full">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'resume' | 'cover' | 'skills')}>
                            <div className="flex items-center justify-between mb-4">
                                <TabsList>
                                    <TabsTrigger value="resume">Resume</TabsTrigger>
                                    <TabsTrigger value="cover" className="flex items-center gap-2">
                                        Cover Letter
                                        {activeTab === 'cover' && (coverLetterLoading || waitingForCoverLetter) && (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="skills" className="flex items-center gap-2">
                                        Skill Map
                                        {activeTab === 'skills' && (skillMapLoading || waitingForSkillMap) && (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                                {activeTab === 'cover' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleReloadCoverLetters}
                                        disabled={!activeResumeId || coverLetterLoading || waitingForCoverLetter}
                                    >
                                        {coverLetterLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        Refresh
                                    </Button>
                                )}
                                {activeTab === 'skills' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleReloadSkillMaps}
                                        disabled={!activeResumeId || skillMapLoading || waitingForSkillMap}
                                    >
                                        {skillMapLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        Refresh
                                    </Button>
                                )}
                            </div>

                            <TabsContent value="resume">
                                <Card
                                    className="glass-card p-4 md:p-6 overflow-auto"
                                    style={{ maxWidth: 'calc(210mm + 3rem)', minWidth: 'calc(210mm + 3rem)' }}
                                >
                                    <div className="w-full flex justify-center">
                                        <WebResumeRenderer
                                            data={resumeData}
                                            variant={selectedVariant}
                                            onUpdate={setResumeData}
                                            themeMode={themeMode}
                                            onThemeModeChange={setThemeMode}
                                        />
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="cover">
                                <CoverLetterPanel
                                    activeResumeId={activeResumeId}
                                    resumeName={activeResumeLabel}
                                    coverLetters={activeCoverLetters}
                                    loading={coverLetterLoading}
                                    forceLoading={waitingForCoverLetter}
                                    error={coverLetterError}
                                    onReload={handleReloadCoverLetters}
                                    onDelete={handleDeleteCoverLetter}
                                    deletingId={deletingCoverLetterId}
                                    generating={generatingCoverLetter}
                                    onGenerate={handleGenerateCoverLetter}
                                />
                            </TabsContent>

                            <TabsContent value="skills">
                                <SkillMapPanel
                                    activeResumeId={activeResumeId}
                                    resumeName={activeResumeLabel}
                                    skillMaps={activeSkillMaps}
                                    loading={skillMapLoading}
                                    forceLoading={waitingForSkillMap}
                                    error={skillMapError}
                                    onReload={handleReloadSkillMaps}
                                    onDelete={handleDeleteSkillMap}
                                    deletingId={deletingSkillMapId}
                                    generating={generatingSkillMap}
                                    onGenerate={handleGenerateSkillMap}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-6">
                        <Card className="glass-card p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Recent resumes</p>
                                    <p className="text-sm text-muted-foreground">Pick a version to edit or export.</p>
                                </div>
                                <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                                    {availableResumes.length}/3
                                </Badge>
                            </div>
                            {availableResumes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Your generated resumes will appear here after analysis.</p>
                            ) : (
                                <div className="space-y-2">
                                    {availableResumes.map((resume) => {
                                        const timestamp = resume.updatedAt || resume.createdAt
                                        const isActive = resume.id === activeResumeId
                                        const label = resume.fileName || resume.data.personalInfo.name || 'Resume'
                                        const timestampDate = timestamp ? new Date(timestamp) : null
                                        const relativeTime =
                                            timestampDate && !Number.isNaN(timestampDate.getTime())
                                                ? `Updated ${formatDistanceToNow(timestampDate, { addSuffix: true })}`
                                                : 'Recently saved'

                                        return (
                                            <div
                                                key={resume.id || label}
                                                className={cn(
                                                    'w-full rounded-xl border p-3 transition-all duration-200',
                                                    isActive
                                                        ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5'
                                                        : 'border-border/60 hover:border-primary/50'
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectSaved(resume)}
                                                        className="text-left flex-1 min-w-0"
                                                    >
                                                        <p className="text-sm font-semibold truncate">{label}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {relativeTime}
                                                        </p>
                                                    </button>
                                                    <div className="flex items-center gap-2">
                                                        {resume.pdfUrl && (
                                                            <Badge variant="outline" className="text-[10px]">
                                                                PDF
                                                            </Badge>
                                                        )}
                                                        {resume.id && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteSaved(resume.id)
                                                                }}
                                                                disabled={deletingId === resume.id}
                                                            >
                                                                {deletingId === resume.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </Card>

                        <Card className="glass-card p-5 space-y-4 sticky top-24">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Choose a look</p>
                                    <p className="text-sm text-muted-foreground">Switch styles instantly.</p>
                                </div>
                                <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                                    {variantMeta.badge}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {resumeVariants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        type="button"
                                        onClick={() => setSelectedVariant(variant.id)}
                                        className={cn(
                                            'rounded-xl border text-left p-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                                            'bg-gradient-to-br text-white shadow-sm',
                                            variant.accentFrom,
                                            variant.accentTo,
                                            selectedVariant === variant.id
                                                ? 'border-primary shadow-lg shadow-primary/20'
                                                : 'border-border/40 hover:border-primary/50'
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold">{variant.name}</span>
                                            {selectedVariant === variant.id && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs mt-1.5 opacity-80 leading-snug text-white/90">{variant.tagline}</p>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <ResumeChatPanel
                resumeData={resumeData}
                resumeId={activeResumeId}
                onApplyModifications={setResumeData}
                onResetToBaseline={handleReset}
            />

            <MobileBottomNav />
        </div>
    )
}
