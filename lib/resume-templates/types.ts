// Type definitions for resume template system

export interface PersonalInfo {
    name: string
    title?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
}

export interface ResumeItem {
    title: string
    subtitle?: string
    date?: string
    description?: string
    bullets?: string[]
}

export interface ResumeLayout {
    sidebarRatio?: number
}

export type SectionType =
    | 'header'
    | 'summary'
    | 'experience'
    | 'education'
    | 'skills'
    | 'custom'

export type ColumnPlacement = 'sidebar' | 'main'

export interface ResumeSection {
    type: SectionType
    title?: string
    content: string | ResumeItem[]
    /** Optional hint for which column this section should be placed in for split layouts */
    preferredColumn?: ColumnPlacement
}

export interface ResumeData {
    personalInfo: PersonalInfo
    sections: ResumeSection[]
    layout?: ResumeLayout
}
