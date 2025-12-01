const STORAGE_KEY = "cvify:cover-letter-context"
const PENDING_KEY = "cvify:cover-letter-pending"
const PENDING_TTL_MS = 1000 * 60 * 10 // 10 minutes

type CoverLetterContext = {
  jobDescription?: string
  jobLink?: string
}

export function saveCoverLetterContext(rewrittenResumeId: string, context: CoverLetterContext) {
  if (!rewrittenResumeId) return
  if (typeof window === "undefined") return

  const trimmedDescription = context.jobDescription?.trim()
  const trimmedLink = context.jobLink?.trim()

  if (!trimmedDescription && !trimmedLink) return

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, CoverLetterContext>) : {}
    parsed[rewrittenResumeId] = {
      ...(trimmedDescription ? { jobDescription: trimmedDescription } : {}),
      ...(trimmedLink ? { jobLink: trimmedLink } : {}),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch (error) {
    console.error("Failed to persist cover letter context:", error)
  }
}

export function loadCoverLetterContext(rewrittenResumeId: string | null): CoverLetterContext | null {
  if (!rewrittenResumeId) return null
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, CoverLetterContext>
    const context = parsed[rewrittenResumeId]
    if (!context) return null
    const jobDescription = context.jobDescription?.trim()
    const jobLink = context.jobLink?.trim()
    if (!jobDescription && !jobLink) return null
    return {
      ...(jobDescription ? { jobDescription } : {}),
      ...(jobLink ? { jobLink } : {}),
    }
  } catch (error) {
    console.error("Failed to read cover letter context:", error)
    return null
  }
}

export function markCoverLetterPending(rewrittenResumeId: string) {
  if (!rewrittenResumeId) return
  if (typeof window === "undefined") return

  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    parsed[rewrittenResumeId] = Date.now()
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(parsed))
  } catch (error) {
    console.error("Failed to set cover letter pending flag:", error)
  }
}

export function clearCoverLetterPending(rewrittenResumeId: string) {
  if (!rewrittenResumeId) return
  if (typeof window === "undefined") return

  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, number>
    if (parsed[rewrittenResumeId]) {
      delete parsed[rewrittenResumeId]
      window.localStorage.setItem(PENDING_KEY, JSON.stringify(parsed))
    }
  } catch (error) {
    console.error("Failed to clear cover letter pending flag:", error)
  }
}

export function isCoverLetterPending(rewrittenResumeId: string | null): boolean {
  if (!rewrittenResumeId) return false
  if (typeof window === "undefined") return false

  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as Record<string, number>
    const ts = parsed[rewrittenResumeId]
    if (!ts) return false
    const isFresh = Date.now() - ts < PENDING_TTL_MS
    if (!isFresh) {
      clearCoverLetterPending(rewrittenResumeId)
      return false
    }
    return true
  } catch (error) {
    console.error("Failed to read cover letter pending flag:", error)
    return false
  }
}
