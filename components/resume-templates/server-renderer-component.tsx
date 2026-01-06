import { cn } from '@/lib/utils'
import type { ResumeData, ResumeItem } from '@/lib/resume-templates/types'
import type { ResumeVariantId } from '@/lib/resume-templates/variants'
import { A4_DIMENSIONS, balanceSectionsAcrossColumns, resolveSidebarRatio, variantStyles } from '@/lib/resume-templates/server-renderer'

// Helper to normalize section content - converts objects to strings
const normalizeContent = (content: unknown): string | ResumeItem[] => {
    if (typeof content === 'string') return content
    if (Array.isArray(content)) return content as ResumeItem[]
    if (content && typeof content === 'object') {
        // Convert object like { "Soft Skills": [...], "Programming": [...] } to comma-separated string
        const entries = Object.entries(content as Record<string, unknown>)
        return entries.map(([category, items]) => {
            if (Array.isArray(items)) {
                return `${category}: ${items.join(', ')}`
            }
            return `${category}: ${String(items)}`
        }).join(' | ')
    }
    return ''
}

interface ServerResumeRendererProps {
    data: ResumeData
    variant: ResumeVariantId
}

export function ServerResumeRenderer({
    data,
    variant,
}: ServerResumeRendererProps) {
    // Determine styles based on variant
    const styles = variantStyles[variant] || variantStyles.tailored
    const layout = (variant === 'tailored' || variant === 'modern' || variant === 'bold') ? 'split' : 'single'

    const renderSection = (section: typeof data.sections[0], index: number) => {
        const content = normalizeContent(section.content)
        const isList = Array.isArray(content)

        return (
            <div key={index} className={cn('resume-print-section', styles.section)}>
                <div className={styles.sectionTitle}>
                    <span>{section.title || ''}</span>
                </div>

                <div className={cn('resume-print-block', styles.card)}>
                    {isList ? (
                        <div>
                            {(content as ResumeItem[]).map((item, itemIndex) => (
                                <div
                                    key={itemIndex}
                                    className="resume-print-item mb-3 last:mb-0"
                                >
                                    <div className="resume-print-item-head flex justify-between items-start">
                                        <div>
                                            <div className={styles.itemTitle}>
                                                <span>{item.title}</span>
                                            </div>
                                            {item.subtitle !== undefined && (
                                                <div className={styles.subtitle}>
                                                    <span>{item.subtitle}</span>
                                                </div>
                                            )}
                                        </div>
                                        {item.date !== undefined && (
                                            <div className={styles.date}>
                                                <span>{item.date}</span>
                                            </div>
                                        )}
                                    </div>
                                    {item.description !== undefined && (
                                        <div className={styles.paragraph + ' mt-1'}>
                                            {item.description}
                                        </div>
                                    )}
                                    {item.bullets && (
                                        <div className="resume-print-item-body mt-1">
                                            {item.bullets.map((bullet, bulletIndex) => (
                                                <div key={bulletIndex} className={styles.bullet + ' resume-print-bullet flex items-start'}>
                                                    <span className={styles.bulletMarker}>•</span>
                                                    <span className="flex-1">{bullet}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={cn(styles.paragraph, 'min-h-[2rem]')}>
                            {content as string}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const isItemEmpty = (item: ResumeItem) => {
        const hasBullets = Array.isArray(item.bullets) && item.bullets.some((b) => b && b.trim().length > 0)
        const hasDescription = item.description && (typeof item.description === 'string' ? item.description.trim() : String(item.description).trim())
        return !(
            (item.title && item.title.trim()) ||
            (item.subtitle && item.subtitle.trim()) ||
            (item.date && item.date.trim()) ||
            hasDescription ||
            hasBullets
        )
    }

    const isSectionRenderable = (section: ResumeData['sections'][number]) => {
        if (typeof section.content === 'string') {
            return section.content.trim().length > 0
        }
        if (Array.isArray(section.content)) {
            const meaningfulItems = section.content.filter((item) => !isItemEmpty(item))
            return meaningfulItems.length > 0
        }
        // Handle object content (e.g., categorized skills from LLM)
        if (section.content && typeof section.content === 'object') {
            return Object.keys(section.content).length > 0
        }
        return false
    }

    const renderableSections = data.sections.filter((section) => isSectionRenderable(section))
    let sidebarSections: typeof renderableSections = []
    let mainSections: typeof renderableSections = renderableSections

    if (layout === 'split') {
        const balanced = balanceSectionsAcrossColumns(renderableSections)
        sidebarSections = balanced.sidebar
        mainSections = balanced.main
    }
    const shouldSplit = layout === 'split' && sidebarSections.length > 0
    const sidebarRatio = resolveSidebarRatio(data, variant)
    const mainWidth = 100 - sidebarRatio
    const sidebarStyle = shouldSplit ? { flexBasis: `${sidebarRatio}%`, maxWidth: `${sidebarRatio}%` } : undefined
    const mainStyle = shouldSplit ? { flexBasis: `${mainWidth}%`, maxWidth: `${mainWidth}%` } : undefined
    const header = (
        <div className={cn('resume-print-header', styles.header)}>
            <div className={styles.name}>
                <h1>{data.personalInfo.name}</h1>
            </div>
            <div className={styles.title}>
                <p>{data.personalInfo.title || ''}</p>
            </div>
            <div className={styles.contactBlock}>
                {(['email', 'phone', 'location', 'linkedin', 'website'] as const)
                    .filter((field) => ((data.personalInfo[field as keyof typeof data.personalInfo] as string) || '').trim().length > 0)
                    .map((field) => (
                        <div key={field} className={styles.contactLine}>
                            <span>{(data.personalInfo[field as keyof typeof data.personalInfo] as string) || ''}</span>
                        </div>
                    ))}
            </div>
        </div>
    )

    return (
        <div
            className={cn('resume-export-root resume-print-page flex flex-col', styles.page)}
            style={{ minHeight: `${A4_DIMENSIONS.heightMm}mm` }}
        >
            <div className={cn('resume-print-card', styles.pageCard, 'flex-1 h-full')}>
                {!shouldSplit && header}
                {shouldSplit ? (
                    <div className={cn('resume-print-columns', styles.columns)} style={{ alignItems: 'flex-start' }}>
                        <div className={styles.sidebar} style={sidebarStyle}>
                            {header}
                            {sidebarSections.map((section) => renderSection(section, data.sections.indexOf(section)))}
                        </div>
                        <div className={styles.main} style={mainStyle}>
                            {mainSections.map((section) => renderSection(section, data.sections.indexOf(section)))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        {renderableSections.map((section) => renderSection(section, data.sections.indexOf(section)))}
                    </div>
                )}
            </div>
        </div>
    )
}

