import type { ResumeData, ResumeItem } from './types'
import type { ResumeVariantId } from './variants'

export const A4_DIMENSIONS = {
    widthMm: 210,
    heightMm: 297,
    widthPx: 794, // 210mm * 96dpi / 25.4
    heightPx: 1123 // 297mm * 96dpi / 25.4
}

export const RESUME_SCALE_LIMITS = {
    min: 0.6,
    max: 1
}

export const SIDEBAR_RATIO_LIMITS = {
    min: 28,
    max: 55
}

const DEFAULT_SIDEBAR_RATIO: Record<ResumeVariantId, number> = {
    tailored: 40,
    modern: 38,
    bold: 42,
    spotlight: 40,
    classic: 40
}

export const variantStyles: Record<ResumeVariantId, {
    page: string
    header: string
    name: string
    title: string
    contactBlock: string
    contactLine: string
    section: string
    sectionTitle: string
    paragraph: string
    itemTitle: string
    subtitle: string
    date: string
    bullet: string
    bulletMarker: string
    columns: string
    sidebar: string
    main: string
    card: string
    pageCard: string
}> = {
    tailored: {
        page: 'bg-[#0b1220] text-[#e2e8f0] font-sans p-6',
        header: 'mb-4',
        name: 'text-2xl font-bold text-[#e2e8f0] mb-1',
        title: 'text-xs text-[#cbd5e1] mb-1',
        contactBlock: 'mt-1 flex flex-col gap-0.5',
        contactLine: 'text-[10px] text-[#cbd5e1] break-words',
        section: 'mb-4',
        sectionTitle: 'text-[10px] font-bold tracking-widest text-[#cbd5f5] uppercase mb-2',
        paragraph: 'text-[10px] leading-relaxed text-[#e2e8f0]',
        itemTitle: 'text-xs font-bold text-[#e2e8f0]',
        subtitle: 'text-[10px] text-[#cbd5e1] mt-0.5',
        date: 'text-[9px] text-[#cbd5e1] italic',
        bullet: 'text-[9px] text-[#e2e8f0] ml-2 mb-0.5',
        bulletMarker: 'text-[#cbd5f5] font-bold mr-1',
        columns: 'flex flex-row gap-4',
        sidebar: 'w-[40%]',
        main: 'w-[60%]',
        card: 'py-2 px-2.5 rounded-lg border border-[#1f2937] bg-[#111827]',
        pageCard: 'w-full h-full flex flex-col'
    },
    modern: {
        page: 'bg-slate-50 text-slate-800 font-sans p-0 min-h-full flex flex-col',
        header: 'bg-emerald-900 text-white p-4 mb-4',
        name: 'text-3xl font-bold text-white mb-1 tracking-tighter',
        title: 'text-sm text-emerald-200 mb-3 font-light',
        contactBlock: 'mt-1 flex flex-col gap-0.5 text-[10px] text-emerald-100',
        contactLine: 'flex items-center gap-1 opacity-80 break-words',
        section: 'mb-4 px-6',
        sectionTitle: 'text-lg font-bold text-emerald-900 mb-3 flex items-center gap-2 after:content-[""] after:h-0.5 after:flex-1 after:bg-emerald-100',
        paragraph: 'text-xs leading-relaxed text-slate-600',
        itemTitle: 'text-sm font-bold text-slate-900',
        subtitle: 'text-xs font-medium text-emerald-700',
        date: 'text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded self-start',
        bullet: 'text-xs text-slate-600 ml-0 mb-1 pl-3 border-l-2 border-emerald-200',
        bulletMarker: 'hidden',
        columns: 'flex flex-row gap-0 flex-1 min-h-full',
        sidebar: 'w-[38%] bg-slate-100 p-4 min-h-full border-r border-slate-200',
        main: 'w-[62%] py-4 pr-6',
        card: 'p-3 bg-white rounded-lg shadow-sm border border-slate-100',
        pageCard: 'w-full h-full flex flex-col'
    },
    bold: {
        page: 'bg-white text-black font-mono p-6',
        header: 'bg-black text-white p-4 mb-6 -mx-6 transform -skew-y-1',
        name: 'text-4xl font-black text-white mb-2 uppercase tracking-tighter',
        title: 'text-base font-bold text-yellow-400 bg-black inline-block px-2',
        contactBlock: 'mt-3 flex flex-wrap gap-3 text-xs font-bold',
        contactLine: 'bg-white text-black px-1.5 py-0.5 break-words',
        section: 'mb-6',
        sectionTitle: 'text-xl font-black uppercase bg-yellow-400 inline-block px-3 py-0.5 mb-4 transform -rotate-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
        paragraph: 'text-xs font-medium leading-relaxed max-w-prose',
        itemTitle: 'text-base font-bold border-b-2 border-black inline-block mb-1',
        subtitle: 'text-xs font-bold bg-black text-white px-1.5 py-0.5 inline-block mb-1',
        date: 'text-[10px] font-bold border border-black px-1.5 py-0.5 ml-2 inline-block',
        bullet: 'text-xs font-bold flex items-start gap-2 mb-1',
        bulletMarker: 'text-base leading-none text-yellow-500',
        columns: 'flex flex-row gap-4',
        sidebar: 'w-[42%] border-r-4 border-black pr-4',
        main: 'flex-1',
        card: 'p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white',
        pageCard: 'w-full h-full flex flex-col'
    },
    spotlight: {
        page: 'bg-[#fffaf0] text-[#111827] font-sans p-6',
        header: 'mb-4',
        name: 'text-2xl font-bold text-[#111827] mb-1',
        title: 'text-xs text-[#7c2d12] mb-1',
        contactBlock: 'mt-1 flex flex-col gap-0.5',
        contactLine: 'text-[10px] text-[#7c2d12] break-words',
        section: 'mb-4',
        sectionTitle: 'text-[10px] font-bold tracking-widest text-[#c2410c] uppercase mb-2',
        paragraph: 'text-[10px] leading-relaxed text-[#111827]',
        itemTitle: 'text-xs font-bold text-[#111827]',
        subtitle: 'text-[10px] text-[#7c2d12] mt-0.5',
        date: 'text-[9px] text-[#7c2d12] italic',
        bullet: 'text-[9px] text-[#111827] ml-2 mb-0.5',
        bulletMarker: 'text-[#fb923c] font-bold mr-1',
        columns: 'flex flex-row gap-4',
        sidebar: 'w-[40%]',
        main: 'w-[60%]',
        card: 'py-2 px-2.5 rounded-lg border border-[#fde68a] bg-[#fff7e6]',
        pageCard: 'w-full h-full flex flex-col'
    },
    classic: {
        page: 'bg-white text-[#334155] font-serif p-6',
        header: 'mb-4 text-center',
        name: 'text-2xl font-bold text-[#0f172a] mb-1',
        title: 'text-xs text-[#64748b] mb-1',
        contactBlock: 'mt-1 flex flex-col gap-0.5 items-center',
        contactLine: 'text-[10px] text-[#64748b] break-words',
        section: 'mb-4',
        sectionTitle: 'text-[10px] font-bold tracking-widest text-[#0f172a] uppercase mb-2 border-b border-[#e2e8f0] pb-1',
        paragraph: 'text-[10px] leading-relaxed text-[#334155]',
        itemTitle: 'text-xs font-bold text-[#334155]',
        subtitle: 'text-[10px] text-[#64748b] mt-0.5',
        date: 'text-[9px] text-[#64748b] italic',
        bullet: 'text-[9px] text-[#334155] ml-2 mb-0.5',
        bulletMarker: 'text-[#94a3b8] font-bold mr-1',
        columns: 'flex flex-row gap-4',
        sidebar: 'w-[40%]',
        main: 'w-[60%]',
        card: 'py-2 px-2.5',
        pageCard: 'w-full h-full flex flex-col'
    }
}


export function getDefaultSidebarRatio(variant: ResumeVariantId): number {
    return DEFAULT_SIDEBAR_RATIO[variant] ?? DEFAULT_SIDEBAR_RATIO.tailored
}

export function clampSidebarRatio(value: number): number {
    return Math.min(SIDEBAR_RATIO_LIMITS.max, Math.max(SIDEBAR_RATIO_LIMITS.min, value))
}

export function resolveSidebarRatio(data: ResumeData, variant: ResumeVariantId): number {
    const fromData = typeof data.layout?.sidebarRatio === 'number' ? data.layout.sidebarRatio : null
    return clampSidebarRatio(fromData ?? getDefaultSidebarRatio(variant))
}


// Calculate content complexity to determine if compact mode is needed
export function calculateContentComplexity(data: ResumeData): number {
    let complexity = 0
    complexity += data.sections.length * 10
    data.sections.forEach(section => {
        if (Array.isArray(section.content)) {
            complexity += section.content.length * 15
            section.content.forEach(item => {
                if (item.bullets) complexity += item.bullets.length * 5
                if (item.description) complexity += item.description.length / 50
            })
        } else {
            complexity += (section.content as string).length / 100
        }
    })
    return complexity
}

export function getBaseScaleForComplexity(complexity: number): number {
    if (complexity > 160) return 0.82
    if (complexity > 120) return 0.88
    if (complexity > 90) return 0.94
    return 1
}

type ResumeSection = ResumeData['sections'][number]

const SIDEBAR_PRIORITY_TYPES: Set<ResumeSection['type']> = new Set(['skills', 'education'])
const MAIN_ANCHOR_TYPES: Set<ResumeSection['type']> = new Set(['experience', 'summary'])
const REBALANCE_THRESHOLD = 140
const SECTION_BASE_WEIGHT = 70
const ITEM_BASE_WEIGHT = 32

export function estimateSectionWeight(section: ResumeSection): number {
    if (Array.isArray(section.content)) {
        return section.content.reduce((sum, item) => {
            const bulletsWeight = Array.isArray(item.bullets)
                ? item.bullets.reduce((acc, bullet) => acc + Math.max(12, bullet.length * 0.2), 0)
                : 0
            const descriptionWeight = item.description ? Math.max(18, item.description.length * 0.28) : 0
            return sum + ITEM_BASE_WEIGHT + bulletsWeight + descriptionWeight
        }, SECTION_BASE_WEIGHT)
    }

    const textLength = typeof section.content === 'string' ? section.content.length : 0
    return SECTION_BASE_WEIGHT + Math.max(24, textLength * 0.18)
}

export function balanceSectionsAcrossColumns(sections: ResumeSection[]) {
    if (!sections || !Array.isArray(sections)) {
        return { sidebar: [], main: [] }
    }
    const indexedSections = sections.map((section, index) => ({
        section,
        index,
        weight: estimateSectionWeight(section)
    }))

    const sidebar: ResumeSection[] = []
    const main: ResumeSection[] = []
    let sidebarWeight = 0
    let mainWeight = 0

    indexedSections.forEach(({ section, weight }) => {
        if (SIDEBAR_PRIORITY_TYPES.has(section.type)) {
            sidebar.push(section)
            sidebarWeight += weight
            return
        }

        if (MAIN_ANCHOR_TYPES.has(section.type)) {
            main.push(section)
            mainWeight += weight
            return
        }

        main.push(section)
        mainWeight += weight
    })

    const moveToSidebar = (allowedTypes: ResumeSection['type'][]) => {
        allowedTypes.forEach((type) => {
            indexedSections
                .filter((entry) => entry.section.type === type)
                .forEach(({ section, weight }) => {
                    if (!main.includes(section)) return
                    if (mainWeight - sidebarWeight <= REBALANCE_THRESHOLD) return

                    main.splice(main.indexOf(section), 1)
                    sidebar.push(section)
                    mainWeight -= weight
                    sidebarWeight += weight
                })
        })
    }

    if (mainWeight - sidebarWeight > REBALANCE_THRESHOLD) {
        moveToSidebar(['custom'])
    }

    const orderMap = new Map(sections.map((section, index) => [section, index]))
    const sortByOriginalOrder = (list: ResumeSection[]) =>
        list.sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0))

    sortByOriginalOrder(sidebar)
    sortByOriginalOrder(main)

    return { sidebar, main }
}


