"use client"

import * as React from "react"
import { WebResumeRenderer } from "@/components/resume-templates/web-renderer"
import type { ResumeData } from "@/lib/resume-templates/types"
import type { ResumeVariantId } from "@/lib/resume-templates/variants"

interface ResumePreviewSlotProps {
    resumeData: ResumeData
    variant: ResumeVariantId
    themeMode: 'light' | 'dark'
}

export const ResumePreviewSlot = React.memo(function ResumePreviewSlot({
    resumeData,
    variant,
    themeMode
}: ResumePreviewSlotProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [scale, setScale] = React.useState(0.3)

    React.useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
                // Calculate scale to fit
                // Target: 210mm x 297mm (approx 794px x 1123px)
                const targetWidth = 794
                const targetHeight = 1123

                const { width, height } = entry.contentRect

                // Add minimal padding
                const availableWidth = width - 16
                const availableHeight = height - 16

                const scaleX = availableWidth / targetWidth
                const scaleY = availableHeight / targetHeight

                // Fit both dimensions (contain)
                setScale(Math.min(scaleX, scaleY))
            }
        })

        observer.observe(container)
        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center p-2"
        >
            <div
                className="shadow-lg bg-white transition-transform duration-100 ease-out will-change-transform"
                style={{
                    transform: `scale(${scale})`,
                    width: 794,
                    height: 1123,
                    flexShrink: 0,
                }}
            >
                <WebResumeRenderer
                    data={resumeData}
                    variant={variant}
                    onUpdate={() => { }}
                    isEditing={false}
                    themeMode={themeMode}
                />
            </div>
        </div>
    )
})
