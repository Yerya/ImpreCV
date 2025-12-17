"use client"

import React, { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Plus, Trash2, GripVertical, User, Briefcase, GraduationCap, Award, FolderOpen } from "lucide-react"
import type { ResumeData, ResumeItem } from "@/lib/resume-templates/types"

interface MobileResumeFormProps {
    data: ResumeData
    onUpdate: (data: ResumeData) => void
    className?: string
}

const sectionIcons: Record<string, React.ReactNode> = {
    experience: <Briefcase className="h-4 w-4" />,
    education: <GraduationCap className="h-4 w-4" />,
    skills: <Award className="h-4 w-4" />,
    default: <FolderOpen className="h-4 w-4" />,
}

function getSectionIcon(type: string) {
    const normalizedType = type.toLowerCase()
    if (normalizedType.includes('experience') || normalizedType.includes('work')) {
        return sectionIcons.experience
    }
    if (normalizedType.includes('education')) {
        return sectionIcons.education
    }
    if (normalizedType.includes('skill')) {
        return sectionIcons.skills
    }
    return sectionIcons.default
}

export function MobileResumeForm({ data, onUpdate, className }: MobileResumeFormProps) {
    const [openSections, setOpenSections] = useState<string[]>(["personal"])

    const updatePersonalInfo = useCallback((field: keyof typeof data.personalInfo, value: string) => {
        onUpdate({
            ...data,
            personalInfo: {
                ...data.personalInfo,
                [field]: value
            }
        })
    }, [data, onUpdate])

    const updateSection = useCallback((index: number, newSection: typeof data.sections[0]) => {
        const newSections = [...data.sections]
        newSections[index] = newSection
        onUpdate({ ...data, sections: newSections })
    }, [data, onUpdate])

    const removeSection = useCallback((index: number) => {
        const newSections = [...data.sections]
        newSections.splice(index, 1)
        onUpdate({ ...data, sections: newSections })
    }, [data, onUpdate])

    const addSection = useCallback(() => {
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
        setOpenSections((prev) => [...prev, `section-${data.sections.length}`])
    }, [data, onUpdate])

    const updateItem = useCallback((sectionIndex: number, itemIndex: number, newItem: ResumeItem) => {
        const section = data.sections[sectionIndex]
        if (!Array.isArray(section.content)) return

        const newContent = [...section.content]
        newContent[itemIndex] = newItem
        updateSection(sectionIndex, { ...section, content: newContent })
    }, [data.sections, updateSection])

    const addItem = useCallback((sectionIndex: number) => {
        const section = data.sections[sectionIndex]
        const newContent = Array.isArray(section.content) ? section.content : []
        updateSection(sectionIndex, {
            ...section,
            content: [...newContent, { title: 'New Item', description: '' }]
        })
    }, [data.sections, updateSection])

    const removeItem = useCallback((sectionIndex: number, itemIndex: number) => {
        const section = data.sections[sectionIndex]
        if (!Array.isArray(section.content)) return

        const newContent = section.content.filter((_, i) => i !== itemIndex)
        updateSection(sectionIndex, { ...section, content: newContent })
    }, [data.sections, updateSection])

    const addBullet = useCallback((sectionIndex: number, itemIndex: number) => {
        const section = data.sections[sectionIndex]
        if (!Array.isArray(section.content)) return

        const item = section.content[itemIndex]
        const bullets = item.bullets || []
        updateItem(sectionIndex, itemIndex, { ...item, bullets: [...bullets, ''] })
    }, [data.sections, updateItem])

    const updateBullet = useCallback((sectionIndex: number, itemIndex: number, bulletIndex: number, value: string) => {
        const section = data.sections[sectionIndex]
        if (!Array.isArray(section.content)) return

        const item = section.content[itemIndex]
        const bullets = [...(item.bullets || [])]
        bullets[bulletIndex] = value
        updateItem(sectionIndex, itemIndex, { ...item, bullets })
    }, [data.sections, updateItem])

    const removeBullet = useCallback((sectionIndex: number, itemIndex: number, bulletIndex: number) => {
        const section = data.sections[sectionIndex]
        if (!Array.isArray(section.content)) return

        const item = section.content[itemIndex]
        const bullets = (item.bullets || []).filter((_, i) => i !== bulletIndex)
        updateItem(sectionIndex, itemIndex, { ...item, bullets })
    }, [data.sections, updateItem])

    return (
        <div className={cn("space-y-4", className)}>
            <Accordion 
                type="multiple" 
                value={openSections} 
                onValueChange={setOpenSections}
                className="space-y-3"
            >
                {/* Personal Info */}
                <AccordionItem value="personal" className="border rounded-xl overflow-hidden bg-background/50">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 [&[data-state=open]]:bg-accent/30">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-sm">Personal Info</p>
                                <p className="text-xs text-muted-foreground">Name, title, contact</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs">Full Name</Label>
                                <Input
                                    id="name"
                                    value={data.personalInfo.name}
                                    onChange={(e) => updatePersonalInfo('name', e.target.value)}
                                    placeholder="John Doe"
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-xs">Job Title</Label>
                                <Input
                                    id="title"
                                    value={data.personalInfo.title || ''}
                                    onChange={(e) => updatePersonalInfo('title', e.target.value)}
                                    placeholder="Software Engineer"
                                    className="h-9"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.personalInfo.email || ''}
                                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                                        placeholder="email@example.com"
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={data.personalInfo.phone || ''}
                                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                                        placeholder="+1 234 567 890"
                                        className="h-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="location" className="text-xs">Location</Label>
                                <Input
                                    id="location"
                                    value={data.personalInfo.location || ''}
                                    onChange={(e) => updatePersonalInfo('location', e.target.value)}
                                    placeholder="New York, NY"
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="linkedin" className="text-xs">LinkedIn</Label>
                                <Input
                                    id="linkedin"
                                    value={data.personalInfo.linkedin || ''}
                                    onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                                    placeholder="linkedin.com/in/johndoe"
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="website" className="text-xs">Website</Label>
                                <Input
                                    id="website"
                                    value={data.personalInfo.website || ''}
                                    onChange={(e) => updatePersonalInfo('website', e.target.value)}
                                    placeholder="johndoe.com"
                                    className="h-9"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Dynamic Sections */}
                {data.sections.map((section, sectionIndex) => {
                    const isList = Array.isArray(section.content)
                    const sectionKey = `section-${sectionIndex}`

                    return (
                        <AccordionItem key={sectionKey} value={sectionKey} className="border rounded-xl overflow-hidden bg-background/50">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 [&[data-state=open]]:bg-accent/30">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                        {getSectionIcon(section.title || section.type)}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{section.title || 'Untitled Section'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {isList ? `${(section.content as ResumeItem[]).length} items` : 'Text content'}
                                        </p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-2">
                                <div className="space-y-3">
                                    {/* Section Title */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <Label htmlFor={`section-title-${sectionIndex}`} className="text-xs">Section Title</Label>
                                            <Input
                                                id={`section-title-${sectionIndex}`}
                                                value={section.title || ''}
                                                onChange={(e) => updateSection(sectionIndex, { ...section, title: e.target.value })}
                                                className="h-9 mt-1"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 mt-5"
                                            onClick={() => removeSection(sectionIndex)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Section Content */}
                                    {isList ? (
                                        <div className="space-y-3">
                                            {(section.content as ResumeItem[]).map((item, itemIndex) => (
                                                <div
                                                    key={itemIndex}
                                                    className="p-3 border border-border/50 rounded-lg bg-background/50 space-y-2"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-2.5 cursor-grab" />
                                                        <div className="flex-1 space-y-2">
                                                            <Input
                                                                value={item.title || ''}
                                                                onChange={(e) => updateItem(sectionIndex, itemIndex, { ...item, title: e.target.value })}
                                                                placeholder="Title"
                                                                className="h-8 text-sm font-medium"
                                                            />
                                                            {item.subtitle !== undefined && (
                                                                <Input
                                                                    value={item.subtitle || ''}
                                                                    onChange={(e) => updateItem(sectionIndex, itemIndex, { ...item, subtitle: e.target.value })}
                                                                    placeholder="Subtitle (company, school...)"
                                                                    className="h-8 text-sm"
                                                                />
                                                            )}
                                                            {item.date !== undefined && (
                                                                <Input
                                                                    value={item.date || ''}
                                                                    onChange={(e) => updateItem(sectionIndex, itemIndex, { ...item, date: e.target.value })}
                                                                    placeholder="Date range"
                                                                    className="h-8 text-sm"
                                                                />
                                                            )}
                                                            {item.description !== undefined && (
                                                                <Textarea
                                                                    value={item.description || ''}
                                                                    onChange={(e) => updateItem(sectionIndex, itemIndex, { ...item, description: e.target.value })}
                                                                    placeholder="Description"
                                                                    className="min-h-[60px] text-sm resize-none"
                                                                />
                                                            )}
                                                            {/* Bullets */}
                                                            {item.bullets && item.bullets.length > 0 && (
                                                                <div className="space-y-1.5 pl-1">
                                                                    {item.bullets.map((bullet, bulletIndex) => (
                                                                        <div key={bulletIndex} className="flex items-start gap-1.5">
                                                                            <span className="text-muted-foreground mt-2">•</span>
                                                                            <Input
                                                                                value={bullet}
                                                                                onChange={(e) => updateBullet(sectionIndex, itemIndex, bulletIndex, e.target.value)}
                                                                                placeholder="Bullet point"
                                                                                className="h-8 text-sm flex-1"
                                                                            />
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                                onClick={() => removeBullet(sectionIndex, itemIndex, bulletIndex)}
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs text-muted-foreground"
                                                                onClick={() => addBullet(sectionIndex, itemIndex)}
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Add bullet
                                                            </Button>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeItem(sectionIndex, itemIndex)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-9 border-dashed"
                                                onClick={() => addItem(sectionIndex)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Item
                                            </Button>
                                        </div>
                                    ) : (
                                        <Textarea
                                            value={section.content as string}
                                            onChange={(e) => updateSection(sectionIndex, { ...section, content: e.target.value })}
                                            placeholder="Section content..."
                                            className="min-h-[100px] text-sm resize-none"
                                        />
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>

            {/* Add Section Button */}
            <Button
                variant="outline"
                className="w-full h-11 border-dashed"
                onClick={addSection}
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
            </Button>
        </div>
    )
}
