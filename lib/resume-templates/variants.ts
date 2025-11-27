export type ResumeVariantId = 'tailored' | 'minimal' | 'spotlight'

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
        id: 'minimal',
        name: 'Mono Grid',
        tagline: 'Structured mono look for fast scanning',
        accentFrom: 'from-zinc-900/90',
        accentTo: 'to-zinc-700/60',
        badge: 'Minimal'
    },
    {
        id: 'spotlight',
        name: 'Spotlight',
        tagline: 'Bold header, spacious sections with highlights',
        accentFrom: 'from-amber-900/90',
        accentTo: 'to-amber-700/70',
        badge: 'Bold'
    }
]

export const defaultResumeVariant: ResumeVariantId = 'tailored'

export const getVariantById = (id: ResumeVariantId): ResumeVariant =>
    resumeVariants.find((variant) => variant.id === id) ?? resumeVariants[0]
