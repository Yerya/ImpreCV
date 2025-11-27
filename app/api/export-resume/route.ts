import { type NextRequest, NextResponse } from 'next/server'
import { generateResumePDF } from '@/lib/export/pdf-generator'
import type { ResumeData } from '@/lib/resume-templates/types'
import { defaultResumeVariant } from '@/lib/resume-templates/variants'

export async function POST(request: NextRequest) {
    try {
        console.log('=== PDF Export API Called ===')
        const { data, templateId, format } = await request.json()
        console.log('Request data:', { hasData: !!data, templateId, format })

        if (!data || !data.personalInfo) {
            console.error('Invalid resume data received')
            return NextResponse.json(
                { error: 'Invalid resume data' },
                { status: 400 }
            )
        }

        const resumeData: ResumeData = data
        console.log('Resume data parsed:', {
            name: resumeData.personalInfo.name,
            sectionsCount: resumeData.sections.length
        })

        // Only PDF export for now (DOCX can be added later)
        if (format === 'pdf') {
            console.log('Starting PDF generation...')
            const pdfBuffer = await generateResumePDF(resumeData, templateId || defaultResumeVariant)
            console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

            return new NextResponse(new Uint8Array(pdfBuffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="resume-${resumeData.personalInfo.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`
                }
            })
        }

        return NextResponse.json(
            { error: 'Unsupported format. Use "pdf"' },
            { status: 400 }
        )
    } catch (error) {
        console.error('=== PDF Export Error ===')
        console.error('Error type:', error?.constructor?.name)
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        console.error('Full error object:', error)

        return NextResponse.json(
            { error: 'Failed to export resume', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
