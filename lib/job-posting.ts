import { sanitizePlainText } from "./text-utils"

export interface JobMetadata {
  title: string
  company?: string
}

export interface RestrictedSiteResult {
  isRestricted: boolean
  message?: string
}

/**
 * Checks if the URL is from a site that restricts automated access (like LinkedIn).
 * Returns an appropriate user-friendly message if restricted.
 */
export function isRestrictedJobSite(url: string): RestrictedSiteResult {
  if (!url) return { isRestricted: false }

  try {
    const trimmed = url.trim()
    const withProtocol = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withProtocol)
    const hostname = parsed.hostname.toLowerCase()

    // LinkedIn - blocks web scraping and requires authentication
    if (hostname.includes("linkedin.com")) {
      return {
        isRestricted: true,
        message:
          "LinkedIn requires login to view job postings, so we can't fetch the job details automatically. Please copy and paste the job description instead."
      }
    }

    // Indeed - some regions block automated access
    if (hostname.includes("indeed.com") && parsed.pathname.includes("/viewjob")) {
      // Indeed viewjob pages often require JavaScript rendering
      // Note: We don't block Indeed entirely as some pages work
    }

    return { isRestricted: false }
  } catch {
    return { isRestricted: false }
  }
}

const TITLE_PATTERNS = [/^job\s*title[:\-]\s*(.+)$/i, /^title[:\-]\s*(.+)$/i, /^position[:\-]\s*(.+)$/i, /^role[:\-]\s*(.+)$/i]
const COMPANY_PATTERNS = [/^company[:\-]\s*(.+)$/i, /^employer[:\-]\s*(.+)$/i, /^organization[:\-]\s*(.+)$/i]
const SECTION_STOPS = ["responsibilities", "requirements", "qualifications", "about the role", "job description", "what you'll do"]

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
  const cleaned = cleanValue(value).replace(/[^\w\s.,\-()/'"]/g, "")
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

    const idx = filtered.length >= 2 ? filtered.length - 2 : 0
    const candidate = filtered[idx] || ""
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
