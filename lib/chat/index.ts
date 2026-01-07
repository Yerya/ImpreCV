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
    action: "update" | "add" | "delete" | "replace" | "move"
    target: "personalInfo" | "section" | "item" | "bullet"
    path?: string
    sectionIndex?: number
    itemIndex?: number
    bulletIndex?: number
    toIndex?: number
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

export interface ApplyModificationsResult {
    data: ResumeData
    appliedCount: number
}

export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Normalize a bullet value - handles cases where LLM returns {text: "..."} objects instead of strings
 */
function normalizeBullet(bullet: unknown): string {
    if (typeof bullet === "string") return bullet
    if (bullet && typeof bullet === "object" && "text" in bullet && typeof (bullet as { text: unknown }).text === "string") {
        return (bullet as { text: string }).text
    }
    return String(bullet)
}

/**
 * Normalize an array of bullets
 */
function normalizeBullets(bullets: unknown[]): string[] {
    return bullets.map(normalizeBullet)
}

function normalizeMoveIndex(toIndex: number, fromIndex: number, maxIndex: number): number {
    let target = toIndex
    if (target > fromIndex) target -= 1
    if (target < 0) target = 0
    if (target > maxIndex) target = maxIndex
    return target
}

export function applyModifications(
    data: ResumeData,
    modifications: ResumeModification[]
): ResumeData {
    return applyModificationsWithReport(data, modifications).data
}

export function applyModificationsWithReport(
    data: ResumeData,
    modifications: ResumeModification[]
): ApplyModificationsResult {
    let updated = JSON.parse(JSON.stringify(data)) as ResumeData
    let appliedCount = 0

    for (const mod of modifications) {
        try {
            const next = applySingleModification(updated, mod)
            if (JSON.stringify(next) !== JSON.stringify(updated)) {
                appliedCount += 1
            }
            updated = next
        } catch (error) {
            console.warn("Failed to apply modification:", mod, error)
        }
    }

    return { data: updated, appliedCount }
}

function applySingleModification(
    data: ResumeData,
    mod: ResumeModification
): ResumeData {
    const { action, target, sectionIndex, itemIndex, bulletIndex, toIndex, field, value, newSection } = mod

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

            if (action === "move" && typeof sectionIndex === "number" && typeof toIndex === "number") {
                const sections = [...data.sections]
                if (sectionIndex < 0 || sectionIndex >= sections.length) break
                const [moved] = sections.splice(sectionIndex, 1)
                const targetIndex = normalizeMoveIndex(toIndex, sectionIndex, sections.length)
                sections.splice(targetIndex, 0, moved)
                return { ...data, sections }
            }

            if (action === "update" && typeof sectionIndex === "number") {
                const sections = [...data.sections]
                if (field === "title" && typeof value === "string") {
                    sections[sectionIndex] = { ...sections[sectionIndex], title: value }
                } else if (field === "content" && typeof value === "string") {
                    sections[sectionIndex] = { ...sections[sectionIndex], content: value }
                } else if (field === "preferredColumn" && (value === "sidebar" || value === "main")) {
                    sections[sectionIndex] = { ...sections[sectionIndex], preferredColumn: value }
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

            if (action === "move" && typeof itemIndex === "number" && typeof toIndex === "number") {
                if (itemIndex < 0 || itemIndex >= items.length) break
                const [moved] = items.splice(itemIndex, 1)
                const targetIndex = normalizeMoveIndex(toIndex, itemIndex, items.length)
                items.splice(targetIndex, 0, moved)
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }

            if (action === "update" && typeof itemIndex === "number" && field) {
                // Handle bullets field (array of strings or objects with text)
                if (field === "bullets" && Array.isArray(value)) {
                    items[itemIndex] = { ...items[itemIndex], bullets: normalizeBullets(value) }
                    sections[sectionIndex] = { ...section, content: items }
                    return { ...data, sections }
                }
                // Handle string fields
                if (typeof value === "string") {
                    items[itemIndex] = { ...items[itemIndex], [field]: value }
                    sections[sectionIndex] = { ...section, content: items }
                    return { ...data, sections }
                }
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

            if (action === "add" && value != null) {
                bullets.push(normalizeBullet(value))
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

            if (action === "move" && typeof bulletIndex === "number" && typeof toIndex === "number") {
                if (bulletIndex < 0 || bulletIndex >= bullets.length) break
                const [moved] = bullets.splice(bulletIndex, 1)
                const targetIndex = normalizeMoveIndex(toIndex, bulletIndex, bullets.length)
                bullets.splice(targetIndex, 0, moved)
                items[itemIndex] = { ...item, bullets }
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }

            if (action === "update" && typeof bulletIndex === "number" && value != null) {
                bullets[bulletIndex] = normalizeBullet(value)
                items[itemIndex] = { ...item, bullets }
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }

            if (action === "replace" && Array.isArray(value)) {
                items[itemIndex] = { ...item, bullets: normalizeBullets(value) }
                sections[sectionIndex] = { ...section, content: items }
                return { ...data, sections }
            }
            break
        }
    }

    return data
}

export const CHAT_EXAMPLES = [
    "Make my summary stronger in 2-3 sentences",
    "Shorten my skills to the most important ones",
    "Add a bullet about speeding up page loads",
    "Move Education below Work Experience",
    "Rewrite my experience with stronger action verbs",
    "Add a new section called Personal Qualities",
    "Undo my last changes",
]

// Re-export constants from centralized file for backward compatibility
export {
    MAX_CHAT_MESSAGES_STORED as MAX_CHAT_MESSAGES,
    MAX_CHAT_MODIFICATIONS_PER_DAY as MAX_MODIFICATIONS_PER_DAY,
    CHAT_USAGE_RESET_HOURS as USAGE_RESET_HOURS,
    MAX_CHAT_MESSAGE_CHARS as MAX_MESSAGE_CHARS,
    CHAT_STORAGE_KEY
} from "@/lib/constants"
