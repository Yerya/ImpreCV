'use client'

import { useState, useMemo } from 'react'
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

    const variantMeta = getVariantById(selectedVariant)

    const handleReset = () => {
        setResumeData(initialData)
        toast.success('Reset to original content')
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            console.log('Exporting resume with data:', resumeData)
            console.log('Template ID:', selectedVariant)

            const response = await fetch('/api/export-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: resumeData, templateId: selectedVariant, format: 'pdf' })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to export resume')
            }

            const blob = await response.blob()
            if (blob.size === 0) throw new Error('Generated PDF is empty')

            const url = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `resume-${resumeData.personalInfo.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
            document.body.appendChild(anchor)
            anchor.click()
            document.body.removeChild(anchor)
            URL.revokeObjectURL(url)

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
                        <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-2">
                            <Download className="h-4 w-4" />
                            {exporting ? 'Exporting...' : 'Export PDF'}
                        </Button>
                    </div>
                </div>

                <div className="grid xl:grid-cols-[1fr_300px] gap-6 items-start">
                    <Card className="glass-card p-0 overflow-hidden border-0 bg-transparent shadow-none">
                        <WebResumeRenderer
                            data={resumeData}
                            variant={selectedVariant}
                            onUpdate={setResumeData}
                        />
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

