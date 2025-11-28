import React from 'react'
import { cn } from '@/lib/utils'
import type { ResumeData, ResumeItem } from '@/lib/resume-templates/types'
import type { ResumeVariantId } from '@/lib/resume-templates/variants'
import { A4_DIMENSIONS, variantStyles } from '@/lib/resume-templates/server-renderer'

interface ServerResumeRendererProps {
    data: ResumeData
    variant: ResumeVariantId
    themeMode?: 'light' | 'dark'
}

export function ServerResumeRenderer({
    data,
    variant,
    themeMode = 'light',
}: ServerResumeRendererProps) {
    // Determine styles based on variant
    const styles = variantStyles[variant] || variantStyles.tailored
    const layout = (variant === 'tailored' || variant === 'modern' || variant === 'bold') ? 'split' : 'single'

    const renderSection = (section: typeof data.sections[0], index: number) => {
        const isList = Array.isArray(section.content)

        return (
            <div key={index} className={styles.section}>
                <div className={styles.sectionTitle}>
                    <span>{section.title || ''}</span>
                </div>

                <div className={styles.card}>
                    {isList ? (
                        <div>
                            {(section.content as ResumeItem[]).map((item, itemIndex) => (
                                <div key={itemIndex} className="mb-3 last:mb-0">
                                    <div className="flex justify-between items-start">
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
                                        <div className="mt-1">
                                            {item.bullets.map((bullet, bulletIndex) => (
                                                <div key={bulletIndex} className={styles.bullet + ' flex items-start'}>
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
                            {section.content as string}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const sidebarSections = data.sections.filter(s => s.type === 'skills' || s.type === 'education')
    const mainSections = data.sections.filter(s => s.type !== 'skills' && s.type !== 'education')
    const shouldSplit = layout === 'split' && sidebarSections.length > 0

    return (
        <div
            className={cn('mx-auto shadow-2xl transition-all duration-300 relative flex flex-col overflow-hidden', styles.page)}
            style={{
                width: `${A4_DIMENSIONS.widthMm}mm`,
                maxWidth: `${A4_DIMENSIONS.widthMm}mm`,
                minHeight: `${A4_DIMENSIONS.heightMm}mm`
            }}
        >
            <div className={cn(styles.pageCard, 'flex-1 h-full')}>
                <div className={styles.header}>
                    <div className={styles.name}>
                        <h1>{data.personalInfo.name}</h1>
                    </div>
                    <div className={styles.title}>
                        <p>{data.personalInfo.title || ''}</p>
                    </div>
                    <div className={styles.contactBlock}>
                        {['email', 'phone', 'location', 'linkedin', 'website'].map((field) => (
                            <div key={field} className={styles.contactLine}>
                                <span>{(data.personalInfo as any)[field] || ''}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {shouldSplit ? (
                    <div className={styles.columns}>
                        <div className={styles.sidebar}>
                            {sidebarSections.map((section) => renderSection(section, data.sections.indexOf(section)))}
                        </div>
                        <div className={styles.main}>
                            {mainSections.map((section) => renderSection(section, data.sections.indexOf(section)))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        {data.sections.map((section, index) => renderSection(section, index))}
                    </div>
                )}
            </div>
        </div>
    )
}
