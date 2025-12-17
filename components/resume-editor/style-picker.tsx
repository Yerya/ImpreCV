"use client"

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { resumeVariants, getVariantById } from "@/lib/resume-templates/variants"
import type { ResumeVariantId } from "@/lib/resume-templates/variants"

interface StylePickerProps {
    selectedVariant: ResumeVariantId
    onSelect: (variant: ResumeVariantId) => void
    variant?: 'desktop' | 'mobile'
}

export const StylePicker = memo(function StylePicker({
    selectedVariant,
    onSelect,
    variant = 'desktop'
}: StylePickerProps) {
    const variantMeta = getVariantById(selectedVariant)

    if (variant === 'mobile') {
        return (
            <div className="space-y-3">
                {resumeVariants.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelect(v.id)}
                        className={cn(
                            'w-full rounded-xl border text-left p-4 transition-all duration-200',
                            'bg-gradient-to-br text-white shadow-sm',
                            v.accentFrom,
                            v.accentTo,
                            selectedVariant === v.id
                                ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30'
                                : 'border-border/40'
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{v.name}</span>
                            {selectedVariant === v.id && (
                                <Badge className="bg-white/20 text-white border-0">Active</Badge>
                            )}
                        </div>
                        <p className="text-sm mt-1.5 opacity-80 leading-snug text-white/90">{v.tagline}</p>
                    </button>
                ))}
            </div>
        )
    }

    return (
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
                {resumeVariants.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelect(v.id)}
                        className={cn(
                            'rounded-xl border text-left p-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                            'bg-gradient-to-br text-white shadow-sm',
                            v.accentFrom,
                            v.accentTo,
                            selectedVariant === v.id
                                ? 'border-primary shadow-lg shadow-primary/20'
                                : 'border-border/40 hover:border-primary/50'
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{v.name}</span>
                            {selectedVariant === v.id && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white">
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-xs mt-1.5 opacity-80 leading-snug text-white/90">{v.tagline}</p>
                    </button>
                ))}
            </div>
        </Card>
    )
})
