import type { ResumeData } from "@/lib/resume-templates/types"
import type { ResumeVariantId } from "@/lib/resume-templates/variants"
import type { CoverLetter } from "@/components/resume-templates/cover-letter-panel"
import type { SkillMapRecord } from "@/types/skill-map"

export type ResumeMode = 'tailored' | 'improved' | 'created'

export interface SavedResume {
    id: string | null
    data: ResumeData
    variant: ResumeVariantId
    theme: 'light' | 'dark'
    mode?: ResumeMode | null
    pdfUrl?: string | null
    createdAt?: string | null
    updatedAt?: string | null
    fileName?: string | null
}

export interface ResumeEditorProps {
    initialData: ResumeData
    initialVariant?: ResumeVariantId
    initialTheme?: 'light' | 'dark'
    initialMode?: ResumeMode | null
    resumeId?: string | null
    recentResumes?: SavedResume[]
    backHref?: string
}

export interface UseResumeEditorReturn {
    // Resume state
    resumeData: ResumeData
    setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>
    baselineData: ResumeData
    selectedVariant: ResumeVariantId
    setSelectedVariant: React.Dispatch<React.SetStateAction<ResumeVariantId>>
    themeMode: 'light' | 'dark'
    setThemeMode: React.Dispatch<React.SetStateAction<'light' | 'dark'>>
    activeResumeId: string | null
    activeResumeMode: ResumeMode | null
    activeResumeLabel: string
    availableResumes: SavedResume[]

    // Loading states
    saving: boolean
    exporting: boolean
    deletingId: string | null

    // Cover letter state
    activeCoverLetters: CoverLetter[]
    coverLetterLoading: boolean
    coverLetterError: string | null
    generatingCoverLetter: boolean
    deletingCoverLetterId: string | null
    waitingForCoverLetter: boolean

    // Skill map state
    activeSkillMaps: SkillMapRecord[]
    skillMapLoading: boolean
    skillMapError: string | null
    generatingSkillMap: boolean
    deletingSkillMapId: string | null
    waitingForSkillMap: boolean

    // Tab state
    activeTab: 'resume' | 'cover' | 'skills'
    setActiveTab: React.Dispatch<React.SetStateAction<'resume' | 'cover' | 'skills'>>

    // Actions
    handleReset: () => void
    handleSave: () => Promise<void>
    handleExport: () => Promise<void>
    handleSelectSaved: (item: SavedResume) => void
    handleDeleteSaved: (id: string | null) => Promise<void>
    handleGenerateCoverLetter: () => Promise<void>
    handleDeleteCoverLetter: (id: string) => Promise<void>
    handleReloadCoverLetters: () => void
    handleUpdateCoverLetter: (id: string, content: string) => void
    handleGenerateSkillMap: () => Promise<void>
    handleDeleteSkillMap: (id: string) => Promise<void>
    handleReloadSkillMaps: () => void
}
