import { type NextRequest } from "next/server"

export function getSafeRedirectPath(input: string | null | undefined, fallback = "/") {
  if (!input) return fallback

  const trimmed = input.trim()
  if (!trimmed) return fallback

  if (!trimmed.startsWith("/")) return fallback
  if (trimmed.startsWith("//")) return fallback
  if (trimmed.includes("\\")) return fallback

  return trimmed
}

export function getServerOrigin(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto")

  if (forwardedHost) {
    return `${forwardedProto || "https"}://${forwardedHost}`
  }

  return request.nextUrl.origin
}

