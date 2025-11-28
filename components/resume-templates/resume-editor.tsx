'use client'

import { useState, useMemo, useLayoutEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlobalHeader } from '@/components/global-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Download, RefreshCw } from 'lucide-react'
import { parseMarkdownToResumeData } from '@/lib/resume-parser-structured'
import { defaultResumeVariant, getVariantById, resumeVariants } from '@/lib/resume-templates/variants'
import type { ResumeData } from '@/lib/resume-templates/types'
import type { ResumeVariantId } from '@/lib/resume-templates/variants'
import { WebResumeRenderer } from './web-renderer'
import { A4_DIMENSIONS, calculateContentComplexity, getBaseScaleForComplexity, RESUME_SCALE_LIMITS } from '@/lib/resume-templates/server-renderer'

interface ResumeEditorProps {
    initialText: string
    initialVariant?: ResumeVariantId
    backHref?: string
}

export function ResumeEditor({
    initialText,
    initialVariant = defaultResumeVariant,
    backHref = '/dashboard'
}: ResumeEditorProps) {
    // Parse initial markdown once to get structured data
    const initialData = useMemo(() => parseMarkdownToResumeData(initialText), [initialText])

    const [resumeData, setResumeData] = useState<ResumeData>(initialData)
    const [selectedVariant, setSelectedVariant] = useState<ResumeVariantId>(initialVariant)
    const [exporting, setExporting] = useState(false)
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
    const [pageScale, setPageScale] = useState(1)
    const [previewZoom, setPreviewZoom] = useState(1)
    const resumeRef = useRef<HTMLDivElement | null>(null)
    const previewShellRef = useRef<HTMLDivElement | null>(null)

    const variantMeta = getVariantById(selectedVariant)
    const baseScale = useMemo(
        () => getBaseScaleForComplexity(calculateContentComplexity(resumeData)),
        [resumeData]
    )

    useLayoutEffect(() => {
        setPageScale(baseScale)
    }, [baseScale])

    useLayoutEffect(() => {
        const resumeElement = resumeRef.current
        const shellElement = previewShellRef.current
        if (!resumeElement || !shellElement) return

        const measure = () => {
            const rawWidth = resumeElement.scrollWidth || A4_DIMENSIONS.widthPx
            const rawHeight = resumeElement.scrollHeight || A4_DIMENSIONS.heightPx
            const widthFit = A4_DIMENSIONS.widthPx / rawWidth
            const heightFit = A4_DIMENSIONS.heightPx / rawHeight
            const fitScale = Math.min(baseScale, widthFit, heightFit, 1)
            const nextPageScale = Math.max(
                RESUME_SCALE_LIMITS.min,
                Math.min(RESUME_SCALE_LIMITS.max, Number(fitScale.toFixed(3)))
            )

            if (Math.abs(nextPageScale - pageScale) > 0.01) {
                setPageScale(nextPageScale)
            }

            const renderedWidth = A4_DIMENSIONS.widthPx * nextPageScale
            const availableWidth = shellElement.clientWidth || renderedWidth
            const zoom = Math.min(1, availableWidth / renderedWidth)
            const nextZoom = Math.max(0.75, Number(zoom.toFixed(3)))

            if (Math.abs(nextZoom - previewZoom) > 0.01) {
                setPreviewZoom(nextZoom)
            }
        }

        measure()

        const observer = new ResizeObserver(measure)
        observer.observe(resumeElement)
        observer.observe(shellElement)

        return () => observer.disconnect()
    }, [resumeData, selectedVariant, themeMode, baseScale, pageScale, previewZoom])

    const handleReset = () => {
        setResumeData(initialData)
        toast.success('Reset to original content')
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            console.log('=== CLIENT: Exporting resume with data:', resumeData)
            console.log('=== CLIENT: Template ID:', selectedVariant)
            console.log('=== CLIENT: Theme mode:', themeMode)

            const response = await fetch('/api/export-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: resumeData,
                    templateId: selectedVariant,
                    format: 'pdf',
                    themeConfig: { mode: themeMode }
                })
            })

            console.log('=== CLIENT: Response status:', response.status)
            console.log('=== CLIENT: Response headers:', Object.fromEntries(response.headers.entries()))

            if (!response.ok) {
                let errorMessage = 'Failed to export resume'
                let errorDetails = {}

                try {
                    const contentType = response.headers.get('content-type')
                    console.log('=== CLIENT: Error response content-type:', contentType)

                    if (contentType?.includes('application/json')) {
                        errorDetails = await response.json()
                        errorMessage = errorDetails.error || errorMessage
                        console.error('=== CLIENT: Server error details:', errorDetails)
                    } else {
                        const textError = await response.text()
                        console.error('=== CLIENT: Server error (text):', textError)
                        errorMessage = textError || errorMessage
                    }
                } catch (parseError) {
                    console.error('=== CLIENT: Failed to parse error response:', parseError)
                }

                throw new Error(errorMessage)
            }

            console.log('=== CLIENT: Response OK, reading blob ===')
            const blob = await response.blob()
            console.log('=== CLIENT: Blob size:', blob.size, 'bytes')

            if (blob.size === 0) throw new Error('Generated PDF is empty')

            const url = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `resume-${resumeData.personalInfo.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
            document.body.appendChild(anchor)
            anchor.click()
            document.body.removeChild(anchor)
            URL.revokeObjectURL(url)

            console.log('=== CLIENT: PDF downloaded successfully ===')
            toast.success('PDF ready')
        } catch (error) {
            console.error('=== CLIENT: PDF export error:', error)
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
                        <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-2">
                            <Download className="h-4 w-4" />
                            {exporting ? 'Exporting...' : 'Export PDF'}
                        </Button>
                    </div>
                </div>

                <div className="grid xl:grid-cols-[1fr_300px] gap-6 items-start">
                    <Card className="glass-card p-0 overflow-visible border-0 bg-transparent shadow-none">
                        <div className="w-full overflow-visible flex justify-center" ref={previewShellRef}>
                            <div
                                style={{
                                    transform: `scale(${previewZoom})`,
                                    transformOrigin: 'top center',
                                    width: '100%'
                                }}
                            >
                                <div
                                    ref={resumeRef}
                                    className="transform origin-top"
                                    style={{
                                        ['--resume-scale' as any]: pageScale,
                                        width: `${A4_DIMENSIONS.widthMm}mm`,
                                        minHeight: `${A4_DIMENSIONS.heightMm}mm`,
                                        transform: 'scale(var(--resume-scale))',
                                        transformOrigin: 'top center',
                                        margin: '0 auto'
                                    }}>
                                    <WebResumeRenderer
                                        data={resumeData}
                                        variant={selectedVariant}
                                        onUpdate={setResumeData}
                                        themeMode={themeMode}
                                        onThemeModeChange={setThemeMode}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-6">
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
                                            'bg-gradient-to-br',
                                            variant.accentFrom,
                                            variant.accentTo,
                                            selectedVariant === variant.id
                                                ? 'border-primary shadow-lg shadow-primary/10 text-white'
                                                : 'border-border/50 text-foreground/90 hover:border-primary/50'
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
                                        <p className="text-xs mt-1.5 opacity-80 leading-snug">{variant.tagline}</p>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <MobileBottomNav />
        </div>
    )
}
