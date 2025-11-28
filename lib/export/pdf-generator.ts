import { renderToStream } from '@react-pdf/renderer'
import { ResumeVariantTemplate } from '../resume-templates/renderers/variant-template'
import type { ResumeData } from '../resume-templates/types'
import type { ResumeVariantId } from '../resume-templates/variants'
import { defaultResumeVariant } from '../resume-templates/variants'

/**
 * Generate PDF from resume data using specified template
 * @param data - Structured resume data
 * @param templateId - Visual variant id
 * @returns PDF as Buffer
 */
export async function generateResumePDF(
    data: ResumeData,
    templateId: ResumeVariantId = defaultResumeVariant,
    themeConfig?: { mode?: 'light' | 'dark' }
): Promise<Buffer> {
    const variant = templateId || defaultResumeVariant
    const element = ResumeVariantTemplate({ data, variantId: variant, themeConfig })

    const stream = await renderToStream(element)

    // Convert stream to buffer
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
    })
}

/**
 * Generate PDF and return as blob URL for client-side download
 * @param data - Structured resume data
 * @param templateId - Template ID
 * @param filename - Download filename
 */
export async function downloadResumePDF(
    data: ResumeData,
    templateId: ResumeVariantId = defaultResumeVariant,
    filename: string = 'resume.pdf'
): Promise<void> {
    try {
        const response = await fetch('/api/export-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, templateId, format: 'pdf' })
        })

        if (!response.ok) {
            throw new Error('Failed to generate PDF')
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    } catch (error) {
        throw error
    }
}
