'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { ResumeData, ResumeItem, SectionType } from '@/lib/resume-templates/types'
import type { ResumeVariantId } from '@/lib/resume-templates/variants'
import { EditableText, EditableList } from './editable-elements'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface WebResumeRendererProps {
    data: ResumeData
    variant: ResumeVariantId
    onUpdate: (data: ResumeData) => void
    isEditing?: boolean
}

const variantStyles: Record<ResumeVariantId, {
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
        page: 'bg-[#0b1220] text-[#e2e8f0] font-sans p-8',
        header: 'mb-6',
        name: 'text-3xl font-bold text-[#e2e8f0] mb-1',
        title: 'text-sm text-[#cbd5e1] mb-2',
        contactBlock: 'mt-2 flex flex-col gap-1',
        contactLine: 'text-xs text-[#cbd5e1]',
        section: 'mb-6',
        sectionTitle: 'text-xs font-bold tracking-widest text-[#cbd5f5] uppercase mb-3',
        paragraph: 'text-[11px] leading-relaxed text-[#e2e8f0]',
        itemTitle: 'text-sm font-bold text-[#e2e8f0]',
        subtitle: 'text-[11px] text-[#cbd5e1] mt-0.5',
        date: 'text-[10px] text-[#cbd5e1] italic',
        bullet: 'text-[10px] text-[#e2e8f0] ml-3 mb-1',
        bulletMarker: 'text-[#cbd5f5] font-bold mr-1.5',
        columns: 'flex flex-row gap-6',
        sidebar: 'w-[35%]',
        main: 'w-[65%]',
        card: 'py-2.5 px-3 rounded-lg border border-[#1f2937] bg-[#111827]',
        pageCard: 'p-6 rounded-xl bg-[#111827] border border-[#1f2937]'
    },
    minimal: {
        page: 'bg-[#0b0b0f] text-[#f4f4f5] font-sans p-8',
        header: 'mb-6',
        name: 'text-3xl font-bold text-[#f4f4f5] mb-1',
        title: 'text-sm text-[#d4d4d8] mb-2',
        contactBlock: 'mt-2 flex flex-col gap-1',
        contactLine: 'text-xs text-[#d4d4d8]',
        section: 'mb-6',
        sectionTitle: 'text-xs font-bold tracking-widest text-[#fafafa] uppercase mb-3',
        paragraph: 'text-[11px] leading-relaxed text-[#f4f4f5]',
        itemTitle: 'text-sm font-bold text-[#f4f4f5]',
        subtitle: 'text-[11px] text-[#d4d4d8] mt-0.5',
        date: 'text-[10px] text-[#d4d4d8] italic',
        bullet: 'text-[10px] text-[#f4f4f5] ml-3 mb-1',
        bulletMarker: 'text-[#fafafa] font-bold mr-1.5',
        columns: 'flex flex-row gap-6',
        sidebar: 'w-[35%]',
        main: 'w-[65%]',
        card: 'py-2.5 px-3 rounded-lg border border-[#27272a] bg-[#0f0f13]',
        pageCard: 'p-6 rounded-xl bg-[#0f0f13] border border-[#27272a]'
    },
    spotlight: {
        page: 'bg-[#fffaf0] text-[#111827] font-sans p-8',
        header: 'mb-6',
        name: 'text-3xl font-bold text-[#111827] mb-1',
        title: 'text-sm text-[#7c2d12] mb-2',
        contactBlock: 'mt-2 flex flex-col gap-1',
        contactLine: 'text-xs text-[#7c2d12]',
        section: 'mb-6',
        sectionTitle: 'text-xs font-bold tracking-widest text-[#c2410c] uppercase mb-3',
        paragraph: 'text-[11px] leading-relaxed text-[#111827]',
        itemTitle: 'text-sm font-bold text-[#111827]',
        subtitle: 'text-[11px] text-[#7c2d12] mt-0.5',
        date: 'text-[10px] text-[#7c2d12] italic',
        bullet: 'text-[10px] text-[#111827] ml-3 mb-1',
        bulletMarker: 'text-[#c2410c] font-bold mr-1.5',
        columns: 'flex flex-row gap-6',
        sidebar: 'w-[35%]',
        main: 'w-[65%]',
        card: 'py-2.5 px-3 rounded-lg border border-[#fde68a] bg-[#fff7e6]',
        pageCard: 'p-6 rounded-xl bg-[#fff7e6] border border-[#fde68a]'
    }
}

export function WebResumeRenderer({ data, variant, onUpdate, isEditing = true }: WebResumeRendererProps) {
    const styles = variantStyles[variant] || variantStyles.tailored
    const layout = variant === 'tailored' ? 'split' : 'single' // Simplified logic for now, matching PDF template defaults

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
                            renderItem={(item, itemIndex, updateItem) => (
                                <div className="mb-3 last:mb-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className={styles.itemTitle}>
                                                <EditableText
                                                    value={item.title}
                                                    onChange={(val) => updateItem({ ...item, title: val })}
                                                    tagName="span"
                                                />
                                            </div>
                                            {item.subtitle !== undefined && (
                                                <div className={styles.subtitle}>
                                                    <EditableText
                                                        value={item.subtitle}
                                                        onChange={(val) => updateItem({ ...item, subtitle: val })}
                                                        tagName="span"
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
                                            renderItem={(bullet, bulletIndex, updateBullet) => (
                                                <div className={styles.bullet + ' flex items-start'}>
                                                    <span className={styles.bulletMarker}>•</span>
                                                    <EditableText
                                                        value={bullet}
                                                        onChange={updateBullet}
                                                        tagName="span"
                                                        className="flex-1"
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
                            />
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
        <div className={cn('min-h-[800px] w-full mx-auto shadow-2xl transition-all duration-300', styles.page)}>
            <div className={styles.pageCard}>
                <div className={styles.header}>
                    <div className={styles.name}>
                        <EditableText
                            value={data.personalInfo.name}
                            onChange={(val) => updatePersonalInfo('name', val)}
                            tagName="h1"
                        />
                    </div>
                    <div className={styles.title}>
                        <EditableText
                            value={data.personalInfo.title || ''}
                            onChange={(val) => updatePersonalInfo('title', val)}
                            tagName="p"
                        />
                    </div>
                    <div className={styles.contactBlock}>
                        {['email', 'phone', 'location', 'linkedin', 'website'].map((field) => (
                            <div key={field} className={styles.contactLine}>
                                <EditableText
                                    value={(data.personalInfo as any)[field] || ''}
                                    onChange={(val) => updatePersonalInfo(field as any, val)}
                                    placeholder={field}
                                    tagName="span"
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
