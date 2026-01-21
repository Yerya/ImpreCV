export function getSafeRedirectPath(input: string | null | undefined, fallback = "/") {
  if (!input) return fallback

  const trimmed = input.trim()
  if (!trimmed) return fallback

  if (!trimmed.startsWith("/")) return fallback
  if (trimmed.startsWith("//")) return fallback
  if (trimmed.includes("\\")) return fallback

  return trimmed
}

