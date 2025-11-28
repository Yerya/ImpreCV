export type ResumeVariantId = 'tailored' | 'modern' | 'bold'

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
        tagline: 'Narrative, human tone with gentle contrast',
        accentFrom: 'from-slate-900/90',
        accentTo: 'to-slate-700/70',
        badge: 'Narrative'
    },
    {
        id: 'modern',
        name: 'Modern Edge',
        tagline: 'Clean sidebar layout with bold accents',
        accentFrom: 'from-emerald-900/90',
        accentTo: 'to-emerald-700/70',
        badge: 'Creative'
    },
    {
        id: 'bold',
        name: 'Bold Impact',
        tagline: 'High contrast, large typography, grid layout',
        accentFrom: 'from-rose-900/90',
        accentTo: 'to-rose-700/70',
        badge: 'Impact'
    }
]

export const defaultResumeVariant: ResumeVariantId = 'tailored'

export const getVariantById = (id: ResumeVariantId): ResumeVariant =>
    resumeVariants.find((variant) => variant.id === id) ?? resumeVariants[0]
