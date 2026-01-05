"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { defaultResumeVariant } from "@/lib/resume-templates/variants"
import { useResumeEditor } from "./use-resume-editor"
import { MobileResumeEditor } from "./mobile-resume-editor"
import { DesktopResumeEditor } from "./desktop-resume-editor"
import type { ResumeEditorProps } from "./types"

export function ResumeEditor({
    initialData,
    initialVariant = defaultResumeVariant,
    initialTheme = 'light',
    initialMode = null,
    resumeId = null,
    recentResumes = [],
    backHref = '/dashboard'
}: ResumeEditorProps) {
    const isMobile = useIsMobile()
    
    const editor = useResumeEditor({
        initialData,
        initialVariant,
        initialTheme,
        initialMode,
        resumeId,
        recentResumes,
        backHref
    })

    // Only show cover letter and skill map tabs for tailored resumes
    const showJobRelatedTabs = editor.activeResumeMode === 'tailored' || editor.activeResumeMode === null

    if (isMobile) {
        return <MobileResumeEditor editor={editor} backHref={backHref} showJobRelatedTabs={showJobRelatedTabs} />
    }

    return <DesktopResumeEditor editor={editor} backHref={backHref} showJobRelatedTabs={showJobRelatedTabs} />
}
