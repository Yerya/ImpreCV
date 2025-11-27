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

export type SectionType =
    | 'header'
    | 'summary'
    | 'experience'
    | 'education'
    | 'skills'
    | 'custom'

export interface ResumeSection {
    type: SectionType
    title?: string
    content: string | ResumeItem[]
}

export interface ResumeData {
    personalInfo: PersonalInfo
    sections: ResumeSection[]
}
