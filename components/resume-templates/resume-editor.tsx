'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { GlobalHeader } from '@/components/global-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Copy, Download, RefreshCw, Sparkles, Wand2, Check } from 'lucide-react'
import { parseMarkdownToResumeData } from '@/lib/resume-parser-structured'
import { defaultResumeVariant, getVariantById, resumeVariants } from '@/lib/resume-templates/variants'
import type { ResumeData } from '@/lib/resume-templates/types'
import type { ResumeVariantId } from '@/lib/resume-templates/variants'

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
    const [draft, setDraft] = useState(initialText.trim())
    const [selectedVariant, setSelectedVariant] = useState<ResumeVariantId>(initialVariant)
    const [exporting, setExporting] = useState(false)
    const [copied, setCopied] = useState(false)

    const parsedResume = useMemo<ResumeData>(() => parseMarkdownToResumeData(draft), [draft])
    const variantMeta = getVariantById(selectedVariant)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(draft)
            setCopied(true)
            toast.success('Resume text copied')
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Copy error:', error)
            toast.error('Unable to copy right now')
        }
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            console.log('Exporting resume with data:', parsedResume)
            console.log('Template ID:', selectedVariant)

            const response = await fetch('/api/export-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: parsedResume, templateId: selectedVariant, format: 'pdf' })
            })

            console.log('Export response status:', response.status)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('Export error response:', errorData)
                throw new Error(errorData.error || 'Failed to export resume')
            }

            const blob = await response.blob()
            console.log('PDF blob size:', blob.size, 'bytes')

            if (blob.size === 0) {
                throw new Error('Generated PDF is empty')
            }

            const url = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `resume-${parsedResume.personalInfo.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
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
                            Edit directly in text, preview in different looks, then choose to copy or export.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            Live preview
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            Markdown friendly
                        </Badge>
                    </div>
                </div>

                <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
                    <Card className="glass-card p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold mb-1">Edit the text</p>
                                <p className="text-sm text-muted-foreground">
                                    Headings and bullet points are parsed automatically.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDraft(initialText.trim())}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reset
                            </Button>
                        </div>

                        <Textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            className="font-mono text-sm leading-relaxed min-h-[560px] bg-background/60 border-primary/10 focus-visible:ring-primary/30"
                            placeholder="# Your name&#10;## Summary&#10;- Impactful bullet..."
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Tip: use markdown headings (##) for sections and bullets for achievements.</span>
                            <span className="font-medium text-foreground/80">{draft.length} chars</span>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Card className="glass-card p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Choose a look</p>
                                    <p className="text-sm text-muted-foreground">Switch styles without re-entering data.</p>
                                </div>
                                <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                                    {variantMeta.badge}
                                </Badge>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3">
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

                        <Card className="glass-card overflow-hidden border-primary/10">
                            <div className={cn(
                                'px-5 py-4 flex items-center justify-between gap-3',
                                'bg-gradient-to-r',
                                variantMeta.accentFrom,
                                variantMeta.accentTo,
                                'text-white'
                            )}>
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-[0.16em] opacity-80">Live preview</p>
                                    <p className="text-xl font-semibold flex items-center gap-2">
                                        <Wand2 className="h-5 w-5" />
                                        {variantMeta.name}
                                    </p>
                                    <p className="text-xs opacity-80 leading-relaxed">{variantMeta.tagline}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-2">
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? 'Copied!' : 'Copy text'}
                                    </Button>
                                    <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-2">
                                        <Download className="h-4 w-4" />
                                        {exporting ? 'Exporting...' : 'Export PDF'}
                                    </Button>
                                </div>
                            </div>

                            <div className="p-5 bg-background/80">
                                <ResumePreview data={parsedResume} variantId={selectedVariant} />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <MobileBottomNav />
        </div>
    )
}

interface SectionStyles {
    sectionTitle: string
    card: string
    heading: string
    subtitle: string
    meta: string
    paragraph: string
    bullet: string
    bulletMarker: string
}

const sectionStylesByVariant: Record<ResumeVariantId, SectionStyles> = {
    tailored: {
        sectionTitle: 'text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase',
        card: 'rounded-2xl border border-white/10 bg-white/5 shadow-inner shadow-slate-900/30 p-4 space-y-3',
        heading: 'text-base font-semibold text-white',
        subtitle: 'text-sm text-slate-200/90',
        meta: 'text-xs text-slate-300/80 italic',
        paragraph: 'text-sm text-slate-100/90 leading-relaxed',
        bullet: 'text-sm text-slate-50/90 leading-relaxed pl-4 relative',
        bulletMarker: 'absolute left-0 text-emerald-300'
    },
    minimal: {
        sectionTitle: 'text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase',
        card: 'rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3',
        heading: 'text-base font-semibold text-zinc-50',
        subtitle: 'text-sm text-zinc-300',
        meta: 'text-xs text-zinc-500',
        paragraph: 'text-sm text-zinc-200 leading-relaxed',
        bullet: 'text-sm text-zinc-200 leading-relaxed pl-4 relative',
        bulletMarker: 'absolute left-0 text-primary'
    },
    spotlight: {
        sectionTitle: 'text-xs font-semibold tracking-[0.16em] text-amber-200 uppercase',
        card: 'rounded-xl border border-amber-100/30 bg-amber-50/10 p-4 space-y-3 shadow-sm shadow-amber-200/20',
        heading: 'text-base font-semibold text-amber-50',
        subtitle: 'text-sm text-amber-100/90',
        meta: 'text-xs text-amber-100/70 uppercase',
        paragraph: 'text-sm text-amber-50/90 leading-relaxed',
        bullet: 'text-sm text-amber-50/90 leading-relaxed pl-4 relative',
        bulletMarker: 'absolute left-0 text-amber-200'
    }
}

const renderContactLine = (data: ResumeData, className: string) => {
    const contacts = [
        data.personalInfo.email,
        data.personalInfo.phone,
        data.personalInfo.location,
        data.personalInfo.linkedin,
        data.personalInfo.website
    ].filter(Boolean)

    if (!contacts.length) return null

    return (
        <p className={cn('flex flex-wrap gap-x-3 gap-y-1 text-xs', className)}>
            {contacts.map((value, index) => (
                <span key={index} className="flex items-center gap-1">
                    {value}
                    {index < contacts.length - 1 && <span className="opacity-60">•</span>}
                </span>
            ))}
        </p>
    )
}

const SectionList = ({ data, variant }: { data: ResumeData; variant: ResumeVariantId }) => {
    const styles = sectionStylesByVariant[variant]

    return (
        <div className="space-y-5">
            {data.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-2">
                    {section.title && <div className={styles.sectionTitle}>{section.title}</div>}

                    {typeof section.content === 'string' ? (
                        <div className={styles.card}>
                            <p className={styles.paragraph}>{section.content}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {section.content.map((item, itemIndex) => (
                                <div key={itemIndex} className={styles.card}>
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <p className={styles.heading}>{item.title}</p>
                                            {item.subtitle && <p className={styles.subtitle}>{item.subtitle}</p>}
                                        </div>
                                        {item.date && <p className={styles.meta}>{item.date}</p>}
                                    </div>
                                    {item.description && (
                                        <p className={styles.paragraph}>{item.description}</p>
                                    )}
                                    {item.bullets?.length ? (
                                        <ul className="space-y-2">
                                            {item.bullets.map((bullet, bulletIndex) => (
                                                <li key={bulletIndex} className={styles.bullet}>
                                                    <span className={styles.bulletMarker}>•</span>
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

const ResumePreview = ({ data, variantId }: { data: ResumeData; variantId: ResumeVariantId }) => {
    switch (variantId) {
        case 'minimal':
            return <MinimalPreview data={data} />
        case 'spotlight':
            return <SpotlightPreview data={data} />
        default:
            return <TailoredPreview data={data} />
    }
}

const TailoredPreview = ({ data }: { data: ResumeData }) => (
    <div className="rounded-2xl overflow-hidden bg-slate-900 text-white border border-white/10 shadow-xl">
        <div className="p-6 pb-4 space-y-2 border-b border-white/10">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">Tailored</p>
            <h2 className="text-3xl font-bold leading-tight">{data.personalInfo.name || 'Your name'}</h2>
            {data.personalInfo.title && (
                <p className="text-lg text-emerald-100/90">{data.personalInfo.title}</p>
            )}
            {renderContactLine(data, 'text-emerald-50/90')}
        </div>
        <div className="p-6">
            <SectionList data={data} variant="tailored" />
        </div>
    </div>
)

const MinimalPreview = ({ data }: { data: ResumeData }) => (
    <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 shadow-lg">
        <div className="p-6 border-b border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Mono grid</p>
                    <h2 className="text-2xl font-semibold text-zinc-50">{data.personalInfo.name || 'Your name'}</h2>
                </div>
                {data.personalInfo.title && (
                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-100 border border-zinc-700">
                        {data.personalInfo.title}
                    </span>
                )}
            </div>
            {renderContactLine(data, 'text-zinc-400')}
        </div>
        <div className="p-6 space-y-4">
            <SectionList data={data} variant="minimal" />
        </div>
    </div>
)

const SpotlightPreview = ({ data }: { data: ResumeData }) => (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 border border-amber-100/20 shadow-xl shadow-amber-900/20">
        <div className="p-6 space-y-3 border-b border-amber-100/20">
            <div className="flex items-center gap-2 text-amber-100/80">
                <Sparkles className="h-4 w-4" />
                <span className="text-[11px] uppercase tracking-[0.18em]">Spotlight</span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-semibold text-amber-50 leading-tight">{data.personalInfo.name || 'Your name'}</h2>
                    {data.personalInfo.title && (
                        <p className="text-lg text-amber-100/90">{data.personalInfo.title}</p>
                    )}
                </div>
                <div className="text-right space-y-1 text-amber-100/80">
                    {data.personalInfo.location && <p className="text-sm">{data.personalInfo.location}</p>}
                    {data.personalInfo.email && <p className="text-sm">{data.personalInfo.email}</p>}
                    {data.personalInfo.phone && <p className="text-sm">{data.personalInfo.phone}</p>}
                </div>
            </div>
        </div>
        <div className="p-6">
            <SectionList data={data} variant="spotlight" />
        </div>
    </div>
)
