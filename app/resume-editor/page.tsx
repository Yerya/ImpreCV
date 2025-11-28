'use client'

import { ResumeEditor } from '@/components/resume-templates/resume-editor'

export default function ResumeEditorDemoPage() {
    return (
        <ResumeEditor
            initialText=""
            backHref="/dashboard"
        />
    )
}
