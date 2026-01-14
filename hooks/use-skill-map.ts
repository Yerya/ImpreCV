"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { SkillMapRecord } from "@/types/skill-map"
import { generateSkillMap, apiFetch, API_ENDPOINTS } from "@/lib/api-client"

export interface UseSkillMapOptions {
    activeResumeId: string | null
    activeTab: 'resume' | 'cover' | 'skills'
}

export interface UseSkillMapReturn {
    skillMapsByResume: Record<string, SkillMapRecord[]>
    activeSkillMaps: SkillMapRecord[]
    skillMapLoading: boolean
    skillMapError: string | null
    generatingSkillMap: boolean
    deletingSkillMapId: string | null
    waitingForSkillMap: boolean
    handleGenerateSkillMap: () => Promise<void>
    handleDeleteSkillMap: (id: string) => Promise<void>
    handleReloadSkillMaps: () => void
}

const hasLoadedForResume = <T>(map: Record<string, T>, resumeId: string | null) =>
    !!resumeId && map[resumeId] !== undefined

export function useSkillMap({
    activeResumeId,
    activeTab,
}: UseSkillMapOptions): UseSkillMapReturn {
    const [skillMapsByResume, setSkillMapsByResume] = useState<Record<string, SkillMapRecord[]>>({})
    const [skillMapLoading, setSkillMapLoading] = useState(false)
    const [skillMapError, setSkillMapError] = useState<string | null>(null)
    const skillMapRequestRef = useRef<AbortController | null>(null)
    const [generatingSkillMap, setGeneratingSkillMap] = useState(false)
    const [deletingSkillMapId, setDeletingSkillMapId] = useState<string | null>(null)

    const activeSkillMaps = activeResumeId ? skillMapsByResume[activeResumeId] || [] : []
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
                    const message = typeof data?.error === 'string' ? data.error : 'Failed to load skill analysis'
                    throw new Error(message)
                }

                if (controller.signal.aborted) return

                const dataObj = data as Record<string, unknown>
                const items = Array.isArray(dataObj.items) ? (dataObj.items as SkillMapRecord[]) : []
                setSkillMapsByResume((prev) => ({ ...prev, [resumeId]: items }))
            } catch (error) {
                if (controller.signal.aborted) return
                setSkillMapError(error instanceof Error ? error.message : 'Failed to load skill analysis')
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            skillMapRequestRef.current?.abort()
        }
    }, [])

    // Load skill maps when tab changes
    useEffect(() => {
        if (activeTab !== 'skills' || !activeResumeId) {
            setSkillMapLoading(false)
            return
        }

        const hasLoaded = hasLoadedForResume(skillMapsByResume, activeResumeId)
        if (!hasLoaded) {
            setSkillMapLoading(true)
            loadSkillMaps(activeResumeId, { force: true })
        }
    }, [activeResumeId, activeTab, skillMapsByResume, loadSkillMaps])

    // Load skill maps in background for faster tab open
    useEffect(() => {
        if (!activeResumeId) return

        const hasLoaded = hasLoadedForResume(skillMapsByResume, activeResumeId)
        if (!hasLoaded) {
            loadSkillMaps(activeResumeId, { silent: true })
        }
    }, [activeResumeId, skillMapsByResume, loadSkillMaps])

    // Clear errors when resume changes
    useEffect(() => {
        if (!activeResumeId) {
            setSkillMapError(null)
            setSkillMapLoading(false)
        }
    }, [activeResumeId])

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
            await apiFetch(`${API_ENDPOINTS.SKILL_MAP}/${id}`, { method: 'DELETE' })

            setSkillMapsByResume((prev) => {
                const existing = prev[activeResumeId] || []
                return { ...prev, [activeResumeId]: existing.filter((sm) => sm.id !== id) }
            })
            toast.success('Skill analysis deleted')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete skill analysis')
        } finally {
            setDeletingSkillMapId(null)
        }
    }, [activeResumeId])

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
                toast.info('Skill analysis already exists')
            } else {
                toast.success('Skill analysis generated!')
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate skill analysis'
            setSkillMapError(message)
            toast.error(message)
        } finally {
            setGeneratingSkillMap(false)
            if (!activeSkillMaps.length) {
                setSkillMapLoading(false)
            }
        }
    }, [activeResumeId, activeSkillMaps.length])

    return {
        skillMapsByResume,
        activeSkillMaps,
        skillMapLoading,
        skillMapError,
        generatingSkillMap,
        deletingSkillMapId,
        waitingForSkillMap,
        handleGenerateSkillMap,
        handleDeleteSkillMap,
        handleReloadSkillMaps,
    }
}
