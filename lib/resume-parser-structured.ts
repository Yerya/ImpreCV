import type { ResumeData, ResumeSection, ResumeItem } from './resume-templates/types'

/**
 * Parse markdown resume content into structured ResumeData
 * Enhanced to handle both markdown AND plain text resumes, and now JSON!
 */
export function parseMarkdownToResumeData(input: string): ResumeData {
    // 1. Try to parse as JSON first
    try {
        const trimmed = input.trim()
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const jsonData = JSON.parse(trimmed)
            // Validate basic structure
            if (jsonData.personalInfo && Array.isArray(jsonData.sections)) {
                // NORMALIZE: Fix invalid content formats from AI
                jsonData.sections = jsonData.sections.map((section: Record<string, unknown>) => {
                    if (Array.isArray(section.content)) {
                        // Check if it's an array of plain strings (INVALID format)
                        const allStrings = section.content.every((item: unknown) => typeof item === 'string')
                        if (allStrings && section.content.length > 0) {
                            // Convert string array to structured format
                            console.warn(`Converting invalid string[] to structured format for section: ${section.title}`)
                            return {
                                ...section,
                                content: section.content.map((item: string) => {
                                    // Split by first colon to separate title from description
                                    const colonIndex = item.indexOf(':')

                                    if (colonIndex > 0 && colonIndex < 100) {
                                        // Has colon in reasonable position - use it to split
                                        return {
                                            title: item.substring(0, colonIndex).trim(),
                                            description: item.substring(colonIndex + 1).trim() || null,
                                            bullets: []
                                        }
                                    } else {
                                        // No colon or colon too far - use first sentence as title, rest as description
                                        const sentences = item.split(/[.!?]\s+/)
                                        if (sentences.length > 1 && sentences[0].length < 100) {
                                            return {
                                                title: sentences[0].trim(),
                                                description: sentences.slice(1).join('. ').trim() || null,
                                                bullets: []
                                            }
                                        } else {
                                            // Single sentence or very long first sentence - keep everything
                                            return {
                                                title: item.trim(),
                                                description: null,
                                                bullets: []
                                            }
                                        }
                                    }
                                })
                            }
                        }
                    }
                    return section
                })
                return jsonData as ResumeData
            }
        }
    } catch {
        // Not valid JSON, fall back to markdown parsing
    }

    // Markdown parsing fallback
    const markdown = input
    const lines = markdown.split('\n')

    const resumeData: ResumeData = {
        personalInfo: {
            name: '',
            title: '',
            email: '',
            phone: '',
            location: ''
        },
        sections: []
    }

    let currentSection: ResumeSection | null = null
    let currentItem: ResumeItem | null = null
    let headerParsed = false

    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/
    const phoneRegex = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/

    const sectionKeywords: Record<string, ResumeSection['type']> = {
        'summary': 'summary',
        'professional summary': 'summary',
        'profile': 'summary',
        'about': 'summary',
        'about me': 'summary',
        'experience': 'experience',
        'work experience': 'experience',
        'employment history': 'experience',
        'professional experience': 'experience',
        'education': 'education',
        'academic background': 'education',
        'skills': 'skills',
        'technical skills': 'skills',
        'core competencies': 'skills',
        'projects': 'custom',
        'languages': 'custom',
        'certifications': 'custom'
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        if (!line) continue

        if (!headerParsed && i < 15) {
            const emailMatch = line.match(emailRegex)
            const phoneMatch = line.match(phoneRegex)

            if (emailMatch && !resumeData.personalInfo.email) resumeData.personalInfo.email = emailMatch[0]
            if (phoneMatch && !resumeData.personalInfo.phone) resumeData.personalInfo.phone = phoneMatch[0]
        }

        if (line.startsWith('# ')) {
            resumeData.personalInfo.name = line.replace('# ', '').trim()
            headerParsed = true
            continue
        }

        if (!resumeData.personalInfo.name && !line.startsWith('#') && i < 5) {
            const isNotEmail = !emailRegex.test(line)
            const isNotPhone = !phoneRegex.test(line)
            const isCapitalized = /^[A-ZА-ЯЁ]/.test(line)
            const isReasonableLength = line.length < 50 && line.length > 2

            if (isNotEmail && isNotPhone && isCapitalized && isReasonableLength) {
                resumeData.personalInfo.name = line
                headerParsed = true
                continue
            }
        }

        let isSectionHeader = false
        let sectionType: ResumeSection['type'] = 'custom'
        let sectionTitle = ''

        if (line.startsWith('## ')) {
            isSectionHeader = true
            sectionTitle = line.replace('## ', '').trim()
        }
        else if (line === line.toUpperCase() && line.length > 3 && line.length < 40 && /^[A-Z\s]+$/.test(line)) {
            isSectionHeader = true
            sectionTitle = line
        }
        else {
            const lowerLine = line.toLowerCase().replace(':', '').trim()
            if (sectionKeywords[lowerLine]) {
                isSectionHeader = true
                sectionTitle = line.replace(':', '').trim()
                sectionType = sectionKeywords[lowerLine]
            }
        }

        if (isSectionHeader) {
            if (sectionType === 'custom') {
                const lowerTitle = sectionTitle.toLowerCase()
                for (const [keyword, type] of Object.entries(sectionKeywords)) {
                    if (lowerTitle.includes(keyword)) {
                        sectionType = type
                        break
                    }
                }
            }

            if (currentSection) {
                resumeData.sections.push(currentSection)
            }

            currentSection = {
                type: sectionType,
                title: sectionTitle,
                content: sectionType === 'summary' || sectionType === 'skills' ? '' : []
            }
            currentItem = null
            continue
        }

        if (line.startsWith('### ')) {
            if (currentSection && Array.isArray(currentSection.content)) {
                if (currentItem) (currentSection.content as ResumeItem[]).push(currentItem)
                currentItem = { title: line.replace('### ', '').trim(), bullets: [] }
            }
            continue
        }

        if (line.startsWith('*') && line.endsWith('*')) {
            if (currentItem) {
                const content = line.replace(/^\*|\*$/g, '').trim()
                const parts = content.split('|').map(p => p.trim())
                if (parts.length === 2) {
                    currentItem.subtitle = parts[0]
                    currentItem.date = parts[1]
                } else {
                    currentItem.subtitle = content
                }
            }
            continue
        }

        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
            const bullet = line.replace(/^[-•*]\s*/, '').trim()
            if (currentItem && currentItem.bullets) {
                currentItem.bullets.push(bullet)
            } else if (currentSection && typeof currentSection.content === 'string') {
                currentSection.content += bullet + '\n'
            } else if (currentSection && Array.isArray(currentSection.content)) {
                if (!currentItem) {
                    currentItem = { title: 'Item', bullets: [] }
                }
                currentItem.bullets?.push(bullet)
            }
            continue
        }

        if (currentSection) {
            if (typeof currentSection.content === 'string') {
                currentSection.content += line + '\n'
            } else if (Array.isArray(currentSection.content)) {
                const datePattern = /\d{4}.*\d{4}|present|current/i
                if (currentItem && !currentItem.date && datePattern.test(line) && line.length < 30) {
                    currentItem.date = line
                    continue
                }

                if (!currentItem) {
                    currentItem = { title: line, bullets: [] }
                } else {
                    if (!currentItem.description) currentItem.description = line
                    else currentItem.description += ' ' + line
                }
            }
        } else {
            if (headerParsed && !currentSection) {
                currentSection = {
                    type: 'summary',
                    title: 'Professional Summary',
                    content: line + '\n'
                }
            }
        }
    }

    if (currentItem && currentSection && Array.isArray(currentSection.content)) {
        (currentSection.content as ResumeItem[]).push(currentItem)
    }
    if (currentSection) {
        resumeData.sections.push(currentSection)
    }

    resumeData.sections.forEach(section => {
        if (typeof section.content === 'string') {
            section.content = section.content.trim()
        }
    })

    if (resumeData.sections.length === 0) {
        // Safety check: if input looks like malformed JSON, throw error instead of 
        // creating a section with raw JSON content
        const trimmedInput = markdown.trim()
        if (
            (trimmedInput.startsWith('{') || trimmedInput.startsWith('[')) &&
            (trimmedInput.includes('"personalInfo"') || trimmedInput.includes('"sections"'))
        ) {
            throw new Error('Malformed JSON detected - cannot parse as markdown')
        }
        
        resumeData.sections.push({
            type: 'summary',
            title: 'Resume Content',
            content: markdown
        })
    }

    if (!resumeData.personalInfo.name) {
        resumeData.personalInfo.name = 'Resume'
    }

    return resumeData
}
