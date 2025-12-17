export type ResumeVariantId = 'tailored' | 'modern' | 'bold' | 'spotlight' | 'classic'

export interface ResumeVariant {
    id: ResumeVariantId
    name: string
    tagline: string
    accentFrom: string
    accentTo: string
    badge: string
}

export const resumeVariants: ResumeVariant[] = [
    {
        id: 'tailored',
        name: 'Tailored Flow',
        tagline: 'Editorial, deep blue gradients with soft contrast',
        accentFrom: 'from-slate-900',
        accentTo: 'to-indigo-800',
        badge: 'Editorial'
    },
    {
        id: 'modern',
        name: 'Modern Edge',
        tagline: 'Clean sidebar layout with emerald accents',
        accentFrom: 'from-emerald-900',
        accentTo: 'to-emerald-700',
        badge: 'Minimal'
    },
    {
        id: 'bold',
        name: 'Bold Impact',
        tagline: 'Black + gold, high contrast, block headlines',
        accentFrom: 'from-yellow-500',
        accentTo: 'to-amber-600',
        badge: 'Impact'
    },
    {
        id: 'spotlight',
        name: 'Spotlight',
        tagline: 'Warm tones with orange accents',
        accentFrom: 'from-orange-600',
        accentTo: 'to-amber-500',
        badge: 'Warm'
    },
    {
        id: 'classic',
        name: 'Classic',
        tagline: 'Traditional serif style for formal applications',
        accentFrom: 'from-slate-700',
        accentTo: 'to-slate-500',
        badge: 'Traditional'
    }
]

export const defaultResumeVariant: ResumeVariantId = 'tailored'

export const getVariantById = (id: ResumeVariantId): ResumeVariant =>
    resumeVariants.find((variant) => variant.id === id) ?? resumeVariants[0]
