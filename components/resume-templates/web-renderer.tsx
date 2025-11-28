'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { ResumeData, ResumeItem } from '@/lib/resume-templates/types'
import type { ResumeVariantId } from '@/lib/resume-templates/variants'
import { EditableText, EditableList } from './editable-elements'
import { A4_DIMENSIONS, variantStyles } from '@/lib/resume-templates/server-renderer'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface WebResumeRendererProps {
    data: ResumeData
    variant: ResumeVariantId
    onUpdate: (data: ResumeData) => void
    isEditing?: boolean
    themeMode?: 'light' | 'dark'
    onThemeModeChange?: (mode: 'light' | 'dark') => void
}

const isItemEmpty = (item: ResumeItem) => {
    const hasBullets = Array.isArray(item.bullets) && item.bullets.some((b) => b && b.trim().length > 0)
    return !(
        (item.title && item.title.trim()) ||
        (item.subtitle && item.subtitle.trim()) ||
        (item.date && item.date.trim()) ||
        (item.description && item.description.trim()) ||
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
    return false
}

export function WebResumeRenderer({
    data,
    variant,
    onUpdate,
    isEditing = true,
    themeMode = 'light',
    onThemeModeChange
}: WebResumeRendererProps) {
    // Determine styles based on variant
    const styles = React.useMemo(() => {
        return variantStyles[variant] || variantStyles.tailored
    }, [variant])

    const layout = (variant === 'tailored' || variant === 'modern' || variant === 'bold') ? 'split' : 'single'

    const updatePersonalInfo = (field: keyof typeof data.personalInfo, value: string) => {
        onUpdate({
            ...data,
            personalInfo: {
                ...data.personalInfo,
                [field]: value
            }
        })
    }

    const updateSection = (index: number, newSection: typeof data.sections[0]) => {
        const newSections = [...data.sections]
        newSections[index] = newSection
        onUpdate({ ...data, sections: newSections })
    }

    const removeSection = (index: number) => {
        const newSections = [...data.sections]
        newSections.splice(index, 1)
        onUpdate({ ...data, sections: newSections })
    }

    const addSection = () => {
        onUpdate({
            ...data,
            sections: [
                ...data.sections,
                {
                    type: 'custom',
                    title: 'New Section',
                    content: []
                }
            ]
        })
    }

    const renderSection = (section: typeof data.sections[0], index: number) => {
        const isList = Array.isArray(section.content)

        return (
            <div key={index} className={styles.section + " group/section relative"}>
                <div className={styles.sectionTitle + " flex justify-between items-center"}>
                    <EditableText
                        value={section.title || ''}
                        onChange={(val) => updateSection(index, { ...section, title: val })}
                        tagName="span"
                        readOnly={!isEditing}
                    />
                    {isEditing && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover/section:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => removeSection(index)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                <div className={styles.card}>
                    {isList ? (
                        <EditableList
                            items={section.content as ResumeItem[]}
                            onUpdate={(newItems) => updateSection(index, { ...section, content: newItems })}
                            newItemTemplate={{ title: 'New Item', description: 'Description' }}
                            readOnly={!isEditing}
                            renderItem={(item, itemIndex, updateItem) => (
                                <div className="mb-3 last:mb-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className={styles.itemTitle}>
                                                <EditableText
                                                    value={item.title}
                                                    onChange={(val) => updateItem({ ...item, title: val })}
                                                    tagName="span"
                                                    readOnly={!isEditing}
                                                />
                                            </div>
                                            {item.subtitle !== undefined && (
                                                <div className={styles.subtitle}>
                                                    <EditableText
                                                        value={item.subtitle}
                                                        onChange={(val) => updateItem({ ...item, subtitle: val })}
                                                        tagName="span"
                                                        readOnly={!isEditing}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {item.date !== undefined && (
                                            <div className={styles.date}>
                                                <EditableText
                                                    value={item.date}
                                                    onChange={(val) => updateItem({ ...item, date: val })}
                                                    tagName="span"
                                                    readOnly={!isEditing}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {item.description !== undefined && (
                                        <div className={styles.paragraph + ' mt-1'}>
                                            <EditableText
                                                value={item.description}
                                                onChange={(val) => updateItem({ ...item, description: val })}
                                                multiline
                                                readOnly={!isEditing}
                                            />
                                        </div>
                                    )}
                                    {item.bullets && (
                                        <EditableList
                                            items={item.bullets}
                                            onUpdate={(newBullets) => updateItem({ ...item, bullets: newBullets })}
                                            newItemTemplate="New bullet"
                                            className="mt-1"
                                            addButtonLabel="Add Bullet"
                                            readOnly={!isEditing}
                                            renderItem={(bullet, bulletIndex, updateBullet) => (
                                                <div className={styles.bullet + ' flex items-start'}>
                                                    <span className={styles.bulletMarker}>•</span>
                                                    <EditableText
                                                        value={bullet}
                                                        onChange={updateBullet}
                                                        tagName="span"
                                                        className="flex-1"
                                                        readOnly={!isEditing}
                                                    />
                                                </div>
                                            )}
                                        />
                                    )}
                                </div>
                            )}
                        />
                    ) : (
                        <div className={cn(styles.paragraph, 'min-h-[2rem]')}>
                            <EditableText
                                value={section.content as string}
                                onChange={(val) => updateSection(index, { ...section, content: val })}
                                multiline
                                placeholder="Section content..."
                                readOnly={!isEditing}
                            />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const renderableSections = React.useMemo(
        () => (isEditing ? data.sections : data.sections.filter((section) => isSectionRenderable(section))),
        [data.sections, isEditing]
    )

    const sidebarSections = renderableSections.filter(s => s.type === 'skills' || s.type === 'education')
    const mainSections = renderableSections.filter(s => s.type !== 'skills' && s.type !== 'education')
    const shouldSplit = layout === 'split' && sidebarSections.length > 0

    return (
        <div
            className={cn('w-full mx-auto shadow-2xl transition-all duration-300 relative flex flex-col overflow-hidden', styles.page)}
            style={{
                width: `${A4_DIMENSIONS.widthMm}mm`,
                maxWidth: `${A4_DIMENSIONS.widthMm}mm`,
                minWidth: `${A4_DIMENSIONS.widthMm}mm`,
                minHeight: `${A4_DIMENSIONS.heightMm}mm`
            }}
        >
            <div className={cn(styles.pageCard, 'flex-1 h-full')}>
                <div className={styles.header}>
                    <div className={styles.name}>
                        <EditableText
                            value={data.personalInfo.name}
                            onChange={(val) => updatePersonalInfo('name', val)}
                            tagName="h1"
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className={styles.title}>
                        <EditableText
                            value={data.personalInfo.title || ''}
                            onChange={(val) => updatePersonalInfo('title', val)}
                            tagName="p"
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className={styles.contactBlock}>
                        {(isEditing
                            ? ['email', 'phone', 'location', 'linkedin', 'website']
                            : ['email', 'phone', 'location', 'linkedin', 'website'].filter(
                                (field) => ((data.personalInfo as any)[field] || '').trim().length > 0
                              )
                        ).map((field) => (
                            <div key={field} className={styles.contactLine}>
                                <EditableText
                                    value={(data.personalInfo as any)[field] || ''}
                                    onChange={(val) => updatePersonalInfo(field as any, val)}
                                    placeholder={field}
                                    tagName="span"
                                    readOnly={!isEditing}
                                />
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

                {isEditing && (
                    <div className="mt-8 flex justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" onClick={addSection} className="border-dashed border-muted-foreground/30 text-muted-foreground hover:text-primary">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
