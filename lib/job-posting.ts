import { sanitizePlainText } from "./text-utils"

export interface JobMetadata {
  title: string
  company?: string
}

const TITLE_PATTERNS = [/^job\s*title[:\-]\s*(.+)$/i, /^title[:\-]\s*(.+)$/i, /^position[:\-]\s*(.+)$/i, /^role[:\-]\s*(.+)$/i]
const COMPANY_PATTERNS = [/^company[:\-]\s*(.+)$/i, /^employer[:\-]\s*(.+)$/i, /^organization[:\-]\s*(.+)$/i]
const SECTION_STOPS = ["responsibilities", "requirements", "qualifications", "about the role", "job description", "what you'll do"]

const CLEANUP_REGEX = {
  scripts: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  styles: /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  tags: /<[^>]+>/g,
}

export function normalizeJobLink(jobLink?: string) {
  if (!jobLink) return ""
  try {
    const url = new URL(jobLink.trim())
    if (!["http:", "https:"].includes(url.protocol)) return ""
    return url.toString()
  } catch {
    return ""
  }
}

function cleanValue(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || ""
}

function normalizeLabel(value: string | undefined, fallback?: string) {
  const cleaned = cleanValue(value)
  if (cleaned) {
    return cleaned.slice(0, 160)
  }
  return fallback || ""
}

function matchFromPatterns(lines: string[], patterns: RegExp[]) {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match?.[1]) {
        return cleanValue(match[1])
      }
    }
  }
  return ""
}

function deriveCompanyFromUrl(jobLink?: string) {
  const normalized = normalizeJobLink(jobLink)
  if (!normalized) return ""
  try {
    const url = new URL(normalized)
    const hostParts = url.hostname.split(".").filter(Boolean)
    const filtered = hostParts.filter(
      (part) => !["www", "jobs", "careers", "boards", "apply", "app"].includes(part.toLowerCase()),
    )

    const candidate = filtered.length > 1 ? filtered[filtered.length - 1] : filtered[0]
    if (!candidate) return ""

    return candidate.charAt(0).toUpperCase() + candidate.slice(1)
  } catch {
    return ""
  }
}

function extractCombinedLine(lines: string[]) {
  for (const line of lines) {
    if (line.startsWith("-")) continue
    const atMatch = line.match(/^(?<title>[^|–-]{3,120})\s+at\s+(?<company>[A-Za-z0-9][A-Za-z0-9 .,&'()/-]{2,80})/i)
    if (atMatch?.groups?.title) {
      return {
        title: cleanValue(atMatch.groups.title),
        company: cleanValue(atMatch.groups.company),
      }
    }

    const splitMatch = line.match(/^(?<company>[A-Za-z][A-Za-z0-9 .,&'()/-]{2,80})\s*[-–|]\s*(?<title>[^|–-]{3,120})$/)
    if (splitMatch?.groups?.title) {
      return {
        title: cleanValue(splitMatch.groups.title),
        company: cleanValue(splitMatch.groups.company),
      }
    }
  }

  return { title: "", company: "" }
}

function isTitleCandidate(line: string) {
  if (line.startsWith("-")) return false
  if (line.length < 4 || line.length > 90) return false
  if (line.endsWith(":")) return false
  const lowered = line.toLowerCase()
  if (SECTION_STOPS.some((stop) => lowered.includes(stop))) return false

  const words = line.split(/\s+/)
  if (words.length > 12) return false

  const capitalizedWords = words.filter((word) => /^[A-Z]/.test(word))
  return capitalizedWords.length > 0
}

function findTitleCandidate(lines: string[]) {
  return lines.find(isTitleCandidate) || ""
}

function findCompanyCandidate(lines: string[]) {
  for (const line of lines) {
    const match = line.match(/\bat\s+([A-Z][A-Za-z0-9 .,&'()/-]{2,80})/)
    if (match?.[1]) {
      return cleanValue(match[1])
    }
  }
  return ""
}

export function deriveJobMetadata(jobText: string, jobLink?: string): JobMetadata {
  const cleaned = sanitizePlainText(jobText || "")
  const lines = cleaned.split("\n").map((line) => line.trim()).filter(Boolean)
  const headerLines = lines.slice(0, 12)
  const normalizedLink = normalizeJobLink(jobLink)

  let title = matchFromPatterns(headerLines, TITLE_PATTERNS)
  let company = matchFromPatterns(headerLines, COMPANY_PATTERNS)

  if (!title || !company) {
    const combined = extractCombinedLine(headerLines)
    if (!title && combined.title) title = combined.title
    if (!company && combined.company) company = combined.company
  }

  if (!title) title = findTitleCandidate(headerLines)
  if (!company) company = findCompanyCandidate(headerLines)
  if (!company) company = deriveCompanyFromUrl(normalizedLink)

  return {
    title: normalizeLabel(title, "Job Opportunity"),
    company: normalizeLabel(company) || undefined,
  }
}

export async function fetchJobPostingFromUrl(url: string): Promise<string> {
  const normalizedLink = normalizeJobLink(url)
  if (!normalizedLink) {
    throw new Error("Invalid job link")
  }

  const response = await fetch(normalizedLink, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }

  const html = await response.text()
  let text = html.replace(CLEANUP_REGEX.scripts, "")
  text = text.replace(CLEANUP_REGEX.styles, "")
  text = text.replace(CLEANUP_REGEX.tags, " ")
  text = text.replace(/&nbsp;/g, " ")
  text = text.replace(/&amp;/g, "&")
  text = text.replace(/&lt;/g, "<")
  text = text.replace(/&gt;/g, ">")
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/\s+/g, " ").trim()

  return sanitizePlainText(text.substring(0, 10000))
}
