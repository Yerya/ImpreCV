'use client'

import { useEffect, useState } from 'react'
import { ResumeEditor } from '@/components/resume-templates/resume-editor'
import { createSampleResumeData } from '@/lib/resume-parser-structured'
import { formatResumeToMarkdown } from '@/lib/resume-templates/text'
import { Skeleton } from '@/components/ui/skeleton'

export default function ResumeEditorDemoPage() {
    const [resumeText, setResumeText] = useState<string | null>(null)

    useEffect(() => {
        const storedContent = localStorage.getItem('resume-editor-content')

        if (storedContent?.trim()) {
            setResumeText(storedContent.trim())
            localStorage.removeItem('resume-editor-content')
            return
        }

        const sample = formatResumeToMarkdown(createSampleResumeData())
        setResumeText(sample)
    }, [])

    if (!resumeText) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Skeleton className="h-8 w-64 mx-auto" />
                    <Skeleton className="h-64 w-96 mx-auto" />
                </div>
            </div>
        )
    }

    return (
        <ResumeEditor
            initialText={resumeText}
            backHref="/dashboard"
        />
    )
}
