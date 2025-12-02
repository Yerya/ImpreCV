const PENDING_KEY = "cvify:cover-letter-pending"
const PENDING_TTL_MS = 1000 * 60 * 10 // 10 minutes

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
