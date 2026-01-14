"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { ResumeData } from "@/lib/resume-templates/types"
import type { ResumeVariantId } from "@/lib/resume-templates/variants"

export interface UseResumeExportOptions {
    resumeData: ResumeData
    selectedVariant: ResumeVariantId
    themeMode: 'light' | 'dark'
    activeResumeId: string | null
}

export interface UseResumeExportReturn {
    exporting: boolean
    handleExport: () => Promise<string | null>
}

export function useResumeExport({
    resumeData,
    selectedVariant,
    themeMode,
    activeResumeId,
}: UseResumeExportOptions): UseResumeExportReturn {
    const [exporting, setExporting] = useState(false)

    const handleExport = useCallback(async (): Promise<string | null> => {
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
            toast.success('PDF ready')
            return pdfUrl
        } catch (error) {
            console.error('PDF export error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to export resume')
            return null
        } finally {
            setExporting(false)
        }
    }, [activeResumeId, resumeData, selectedVariant, themeMode])

    return {
        exporting,
        handleExport,
    }
}
