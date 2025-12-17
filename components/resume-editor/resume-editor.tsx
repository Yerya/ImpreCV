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
    resumeId = null,
    recentResumes = [],
    backHref = '/dashboard'
}: ResumeEditorProps) {
    const isMobile = useIsMobile()
    
    const editor = useResumeEditor({
        initialData,
        initialVariant,
        initialTheme,
        resumeId,
        recentResumes,
        backHref
    })

    if (isMobile) {
        return <MobileResumeEditor editor={editor} backHref={backHref} />
    }

    return <DesktopResumeEditor editor={editor} backHref={backHref} />
}
