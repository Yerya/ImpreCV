import type { ResumeData, ResumeSection, ResumeItem } from './resume-templates/types'

/**
 * Parse markdown resume content into structured ResumeData
 * Enhanced to handle both markdown AND plain text resumes
 */
export function parseMarkdownToResumeData(markdown: string): ResumeData {
    const lines = markdown.split('\n')

    // Initialize resume data
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

    // Email and phone regex
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/
    const phoneRegex = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Skip empty lines
        if (!line) continue

        // Try to extract contact info from early lines
        if (!headerParsed && i < 10) {
            const emailMatch = line.match(emailRegex)
            const phoneMatch = line.match(phoneRegex)

            if (emailMatch) resumeData.personalInfo.email = emailMatch[0]
            if (phoneMatch) resumeData.personalInfo.phone = phoneMatch[0]
        }

        // Main heading (name) - markdown style
        if (line.startsWith('# ')) {
            resumeData.personalInfo.name = line.replace('# ', '').trim()
            headerParsed = true
            continue
        }

        // First non-empty line as name if no markdown header found
        if (!resumeData.personalInfo.name && !line.startsWith('#') && i < 5) {
            // Check if it looks like a name (not email, not too long, starts with capital)
            const isNotEmail = !emailRegex.test(line)
            const isNotPhone = !phoneRegex.test(line)
            const isCapitalized = /^[A-ZА-ЯЁ]/.test(line)
            const isReasonableLength = line.length < 50

            if (isNotEmail && isNotPhone && isCapitalized && isReasonableLength) {
                resumeData.personalInfo.name = line
                headerParsed = true
                continue
            }
        }

        // Section headings (markdown style)
        if (line.startsWith('## ')) {
            // Save previous section if exists
            if (currentSection) {
                resumeData.sections.push(currentSection)
            }

            const title = line.replace('## ', '').trim()
            const lowerTitle = title.toLowerCase()
            let type: ResumeSection['type'] = 'custom'

            if (lowerTitle.includes('summary') || lowerTitle.includes('profile') || lowerTitle.includes('about')) {
                type = 'summary'
            } else if (lowerTitle.includes('experience') || lowerTitle.includes('work') || lowerTitle.includes('employment')) {
                type = 'experience'
            } else if (lowerTitle.includes('education')) {
                type = 'education'
            } else if (lowerTitle.includes('skill')) {
                type = 'skills'
            }

            currentSection = {
                type,
                title,
                content: type === 'summary' || type === 'skills' ? '' : []
            }
            currentItem = null
            continue
        }

        // UPPERCASE section headers (plain text style)
        if (line === line.toUpperCase() && line.length > 3 && line.length < 40 && /^[A-Z\s]+$/.test(line)) {
            // Save previous section if exists
            if (currentSection) {
                resumeData.sections.push(currentSection)
            }

            const title = line
            const lowerTitle = title.toLowerCase()
            let type: ResumeSection['type'] = 'custom'

            if (lowerTitle.includes('summary') || lowerTitle.includes('profile') || lowerTitle.includes('about')) {
                type = 'summary'
            } else if (lowerTitle.includes('experience') || lowerTitle.includes('work') || lowerTitle.includes('employment') || lowerTitle.includes('history')) {
                type = 'experience'
            } else if (lowerTitle.includes('education')) {
                type = 'education'
            } else if (lowerTitle.includes('skill')) {
                type = 'skills'
            }

            currentSection = {
                type,
                title,
                content: type === 'summary' || type === 'skills' ? '' : []
            }
            currentItem = null
            continue
        }

        // Sub-headings (job titles, education)
        if (line.startsWith('### ')) {
            if (currentSection && Array.isArray(currentSection.content)) {
                // Save previous item if exists
                if (currentItem) {
                    (currentSection.content as ResumeItem[]).push(currentItem)
                }

                currentItem = {
                    title: line.replace('### ', '').trim(),
                    bullets: []
                }
            }
            continue
        }

        // Italic lines (company, dates) - usually in format *Company | Date*
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

        // Bullet points
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
            const bullet = line.replace(/^[-•*]\s*/, '').trim()

            if (currentItem && currentItem.bullets) {
                currentItem.bullets.push(bullet)
            } else if (currentSection && typeof currentSection.content === 'string') {
                currentSection.content += bullet + '\n'
            }
            continue
        }

        // Regular text
        if (currentSection) {
            if (typeof currentSection.content === 'string') {
                currentSection.content += line + '\n'
            } else if (currentItem) {
                if (!currentItem.description) {
                    currentItem.description = line
                } else {
                    currentItem.description += ' ' + line
                }
            }
        } else {
            // If no section yet and we've parsed header, create a summary section
            if (headerParsed && !currentSection) {
                currentSection = {
                    type: 'summary',
                    title: 'Professional Summary',
                    content: line + '\n'
                }
            }
        }
    }

    // Save last item and section
    if (currentItem && currentSection && Array.isArray(currentSection.content)) {
        (currentSection.content as ResumeItem[]).push(currentItem)
    }
    if (currentSection) {
        resumeData.sections.push(currentSection)
    }

    // Clean up string content
    resumeData.sections.forEach(section => {
        if (typeof section.content === 'string') {
            section.content = section.content.trim()
        }
    })

    // If no sections were created, create one big summary with all text
    if (resumeData.sections.length === 0) {
        resumeData.sections.push({
            type: 'summary',
            title: 'Resume Content',
            content: markdown
        })
    }

    // If no name was extracted, use placeholder
    if (!resumeData.personalInfo.name) {
        resumeData.personalInfo.name = 'Resume'
    }

    return resumeData
}

/**
 * Create sample resume data for testing/demo
 */
export function createSampleResumeData(): ResumeData {
    return {
        personalInfo: {
            name: 'John Doe',
            title: 'Senior Software Engineer',
            email: 'john.doe@example.com',
            phone: '+1 (555) 123-4567',
            location: 'San Francisco, CA',
            linkedin: 'linkedin.com/in/johndoe',
            website: 'johndoe.com'
        },
        sections: [
            {
                type: 'summary',
                title: 'Professional Summary',
                content: 'Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable solutions and driving technical innovation in fast-paced environments.'
            },
            {
                type: 'experience',
                title: 'Work Experience',
                content: [
                    {
                        title: 'Senior Software Engineer',
                        subtitle: 'Google',
                        date: 'Jan 2020 - Present',
                        bullets: [
                            'Led development of key features improving user engagement by 40%',
                            'Architected microservices infrastructure serving 10M+ users',
                            'Mentored team of 5 junior engineers and established best practices',
                            'Reduced system latency by 60% through performance optimization'
                        ]
                    },
                    {
                        title: 'Software Engineer',
                        subtitle: 'Microsoft',
                        date: 'Jun 2017 - Dec 2019',
                        bullets: [
                            'Developed and maintained web applications using React and Node.js',
                            'Implemented automated testing pipeline reducing bugs by 35%',
                            'Collaborated with product team to deliver features on tight deadlines',
                            'Participated in code reviews and technical design discussions'
                        ]
                    }
                ]
            },
            {
                type: 'education',
                title: 'Education',
                content: [
                    {
                        title: 'Bachelor of Science in Computer Science',
                        subtitle: 'Stanford University',
                        date: '2013 - 2017'
                    }
                ]
            },
            {
                type: 'skills',
                title: 'Technical Skills',
                content: 'JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes, PostgreSQL, MongoDB, CI/CD, Agile Methodologies, Team Leadership'
            }
        ]
    }
}
