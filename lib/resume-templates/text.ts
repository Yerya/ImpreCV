import type { ResumeData, ResumeItem, ResumeSection } from './types'

const formatItem = (item: ResumeItem): string[] => {
    const lines: string[] = [`### ${item.title}`]

    const metaParts = [item.subtitle, item.date].filter(Boolean)
    if (metaParts.length) {
        lines.push(`*${metaParts.join(' | ')}*`)
    }

    if (item.description) {
        lines.push(item.description.trim())
    }

    if (item.bullets?.length) {
        lines.push(...item.bullets.filter(Boolean).map((bullet) => `- ${bullet.trim()}`))
    }

    lines.push('')
    return lines
}

const formatSection = (section: ResumeSection): string[] => {
    const lines: string[] = []

    if (section.title) {
        lines.push(`## ${section.title}`)
    }

    if (typeof section.content === 'string') {
        const content = section.content.trim()
        if (content) {
            lines.push(content)
        }
        lines.push('')
        return lines
    }

    section.content.forEach((item) => {
        lines.push(...formatItem(item))
    })

    return lines
}

export const formatResumeToMarkdown = (data: ResumeData): string => {
    const lines: string[] = []
    const { personalInfo } = data

    if (personalInfo.name) {
        lines.push(`# ${personalInfo.name}`)
    }

    if (personalInfo.title) {
        lines.push(personalInfo.title)
    }

    const contactLine = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.website]
        .filter(Boolean)
        .join(' · ')
    if (contactLine) {
        lines.push(contactLine)
    }

    lines.push('')

    data.sections.forEach((section) => {
        lines.push(...formatSection(section))
    })

    return lines.join('\n').trim()
}
