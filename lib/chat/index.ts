import type { ResumeData, ResumeSection, ResumeItem } from "@/lib/resume-templates/types"

export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: number
    pending?: boolean
}

export interface ChatUsage {
    count: number
    maxCount: number
    resetAt: number
}

export interface ResumeModification {
    action: "update" | "add" | "delete" | "replace"
    target: "personalInfo" | "section" | "item" | "bullet"
    path?: string
    sectionIndex?: number
    itemIndex?: number
    bulletIndex?: number
    field?: string
    value?: string | ResumeItem | ResumeSection | string[]
    newSection?: ResumeSection
}

export interface ChatResponse {
    message: string
    modifications?: ResumeModification[]
    usage?: ChatUsage
    error?: string
}

export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function applyModifications(
    data: ResumeData,
    modifications: ResumeModification[]
): ResumeData {
    let updated = JSON.parse(JSON.stringify(data)) as ResumeData

    for (const mod of modifications) {
        try {
            updated = applySingleModification(updated, mod)
        } catch (error) {
            console.warn("Failed to apply modification:", mod, error)
        }
    }

    return updated
}

function applySingleModification(
    data: ResumeData,
    mod: ResumeModification
): ResumeData {
    const { action, target, sectionIndex, itemIndex, bulletIndex, field, value, newSection } = mod

    switch (target) {
        case "personalInfo": {
            // Update a single field
            if (action === "update" && field && typeof value === "string") {
                return {
                    ...data,
                    personalInfo: {
                        ...data.personalInfo,
                        [field]: value
                    }
                }
            }
            // Delete/clear a single field
            if (action === "delete" && field) {
                return {
                    ...data,
                    personalInfo: {
                        ...data.personalInfo,
                        [field]: ""
                    }
                }
            }
            // Clear multiple fields (value is array of field names)
            if (action === "delete" && Array.isArray(value)) {
                const clearedFields: Record<string, string> = {}
                for (const f of value) {
                    if (typeof f === "string") clearedFields[f] = ""
                }
                return {
                    ...data,
                    personalInfo: {
                        ...data.personalInfo,
                        ...clearedFields
                    }
                }
            }
            // Replace entire personalInfo object
            if (action === "replace" && value && typeof value === "object" && !Array.isArray(value)) {
                return {
                    ...data,
                    personalInfo: value as ResumeData["personalInfo"]
                }
            }
            break
        }

        case "section": {
            if (action === "add" && newSection) {
                return {
                    ...data,
                    sections: [...data.sections, newSection]
                }
            }

            if (action === "delete" && typeof sectionIndex === "number") {
                const sections = [...data.sections]
                sections.splice(sectionIndex, 1)
                return { ...data, sections }
            }

            if (action === "update" && typeof sectionIndex === "number") {
                const sections = [...data.sections]
                if (field === "title" && typeof value === "string") {
                    sections[sectionIndex] = { ...sections[sectionIndex], title: value }
                } else if (field === "content" && typeof value === "string") {
                    sections[sectionIndex] = { ...sections[sectionIndex], content: value }
                }
                return { ...data, sections }
            }

            if (action === "replace" && typeof sectionIndex === "number" && newSection) {
                const sections = [...data.sections]
                sections[sectionIndex] = newSection
                return { ...data, sections }
            }
            break
        }

        case "item": {
            if (typeof sectionIndex !== "number") break
            const sections = [...data.sections]
            const section = sections[sectionIndex]
            if (!Array.isArray(section.content)) break

            const items = [...section.content]

            if (action === "add" && value && typeof value === "object" && !Array.isArray(value)) {
                items.push(value as ResumeItem)
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }

            if (action === "delete" && typeof itemIndex === "number") {
                items.splice(itemIndex, 1)
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }

            if (action === "update" && typeof itemIndex === "number" && field && typeof value === "string") {
                items[itemIndex] = { ...items[itemIndex], [field]: value }
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }

            if (action === "replace" && typeof itemIndex === "number" && value && typeof value === "object") {
                items[itemIndex] = value as ResumeItem
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }
            break
        }

        case "bullet": {
            if (
                typeof sectionIndex !== "number" ||
                typeof itemIndex !== "number"
            ) break

            const sections = [...data.sections]
            const section = sections[sectionIndex]
            if (!Array.isArray(section.content)) break

            const items = [...section.content]
            const item = items[itemIndex]
            if (!item.bullets) item.bullets = []

            const bullets = [...item.bullets]

            if (action === "add" && typeof value === "string") {
                bullets.push(value)
                items[itemIndex] = { ...item, bullets }
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }

            if (action === "delete" && typeof bulletIndex === "number") {
                bullets.splice(bulletIndex, 1)
                items[itemIndex] = { ...item, bullets }
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }

            if (action === "update" && typeof bulletIndex === "number" && typeof value === "string") {
                bullets[bulletIndex] = value
                items[itemIndex] = { ...item, bullets }
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }

            if (action === "replace" && Array.isArray(value)) {
                items[itemIndex] = { ...item, bullets: value as string[] }
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }
            break
        }
    }

    return data
}

export const CHAT_EXAMPLES = [
    "Add TypeScript to my skills",
    "Rewrite my summary to focus on leadership",
    "Add a bullet point about improving team productivity by 20%",
    "Change my job title to Senior Developer",
    "Remove the Projects section",
    "Make my experience sound more impactful",
    "Undo my changes / Reset",
    "What is ImpreCV?",
]

export const MAX_CHAT_MESSAGES = 20
export const MAX_MODIFICATIONS_PER_DAY = 50
export const MAX_MESSAGE_CHARS = 500
export const CHAT_STORAGE_KEY = "cvify:chat-history"
