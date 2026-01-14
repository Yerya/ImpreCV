"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { CoverLetter } from "@/components/resume-templates/cover-letter-panel"
import { generateCoverLetter, apiFetch, API_ENDPOINTS } from "@/lib/api-client"
import {
    clearCoverLetterPending,
    isCoverLetterPending,
} from "@/lib/cover-letter-context"

export interface UseCoverLetterOptions {
    activeResumeId: string | null
    activeTab: 'resume' | 'cover' | 'skills'
}

export interface UseCoverLetterReturn {
    coverLettersByResume: Record<string, CoverLetter[]>
    activeCoverLetters: CoverLetter[]
    coverLetterLoading: boolean
    coverLetterError: string | null
    generatingCoverLetter: boolean
    deletingCoverLetterId: string | null
    waitingForCoverLetter: boolean
    handleGenerateCoverLetter: () => Promise<void>
    handleDeleteCoverLetter: (id: string) => Promise<void>
    handleReloadCoverLetters: () => void
    handleUpdateCoverLetter: (id: string, content: string) => void
    setCoverLettersByResume: React.Dispatch<React.SetStateAction<Record<string, CoverLetter[]>>>
}

const hasLoadedForResume = <T>(map: Record<string, T>, resumeId: string | null) =>
    !!resumeId && map[resumeId] !== undefined

export function useCoverLetter({
    activeResumeId,
    activeTab,
}: UseCoverLetterOptions): UseCoverLetterReturn {
    const [coverLettersByResume, setCoverLettersByResume] = useState<Record<string, CoverLetter[]>>({})
    const [coverLetterLoading, setCoverLetterLoading] = useState(false)
    const [coverLetterError, setCoverLetterError] = useState<string | null>(null)
    const coverLetterRequestRef = useRef<AbortController | null>(null)
    const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false)
    const [deletingCoverLetterId, setDeletingCoverLetterId] = useState<string | null>(null)
    const coverLetterPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const coverLetterPollStartRef = useRef<number | null>(null)

    const activeCoverLetters = activeResumeId ? coverLettersByResume[activeResumeId] || [] : []
    const waitingForCoverLetter = activeTab === 'cover' && !!activeResumeId && !activeCoverLetters.length && (coverLetterLoading || generatingCoverLetter)

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
            stopCoverLetterPoll()
        }
    }, [stopCoverLetterPoll])

    // Load cover letters when tab changes
    useEffect(() => {
        if (activeTab !== 'cover' || !activeResumeId) {
            setCoverLetterLoading(false)
            return
        }

        const hasLoaded = hasLoadedForResume(coverLettersByResume, activeResumeId)
        if (activeTab === 'cover' && !hasLoaded) {
            setCoverLetterLoading(true)
            loadCoverLetters(activeResumeId, { force: true })
        }
    }, [activeResumeId, activeTab, coverLettersByResume, loadCoverLetters])

    // Load cover letters in background for chat panel
    useEffect(() => {
        if (!activeResumeId) return

        const hasLoaded = hasLoadedForResume(coverLettersByResume, activeResumeId)
        if (!hasLoaded) {
            loadCoverLetters(activeResumeId, { silent: true })
        }
    }, [activeResumeId, coverLettersByResume, loadCoverLetters])

    // Clear errors when resume changes
    useEffect(() => {
        if (!activeResumeId) {
            setCoverLetterError(null)
            setCoverLetterLoading(false)
        }
    }, [activeResumeId])

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

    const handleDeleteCoverLetter = useCallback(async (id: string) => {
        if (!activeResumeId || !id) return
        setDeletingCoverLetterId(id)
        setCoverLetterError(null)
        try {
            await apiFetch(`${API_ENDPOINTS.COVER_LETTER}/${id}`, { method: 'DELETE' })

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
            toast.success('Cover letter ready')
            return
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

    return {
        coverLettersByResume,
        activeCoverLetters,
        coverLetterLoading,
        coverLetterError,
        generatingCoverLetter,
        deletingCoverLetterId,
        waitingForCoverLetter,
        handleGenerateCoverLetter,
        handleDeleteCoverLetter,
        handleReloadCoverLetters,
        handleUpdateCoverLetter,
        setCoverLettersByResume,
    }
}
