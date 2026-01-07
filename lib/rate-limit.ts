import type { SupabaseClient } from "@supabase/supabase-js"
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS } from "./constants"

interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: Date
}

/**
 * Check rate limit using Supabase RPC
 * @param supabase - Supabase client instance
 * @param key - Rate limit key (e.g., "ip:1.2.3.4" or "user:uuid")
 * @param maxRequests - Maximum requests per window
 * @param windowSeconds - Window duration in seconds
 * @returns Rate limit result with allowed status, remaining count, and reset time
 */
export async function checkRateLimit(
    supabase: SupabaseClient,
    key: string,
    maxRequests = RATE_LIMIT_MAX_REQUESTS,
    windowSeconds = RATE_LIMIT_WINDOW_SECONDS
): Promise<RateLimitResult> {
    try {
        const { data, error } = await supabase.rpc("check_rate_limit", {
            p_key: key,
            p_max_requests: maxRequests,
            p_window_seconds: windowSeconds
        })

        if (error || !data?.[0]) {
            // Fail open on DB errors to prevent blocking legitimate requests
            console.error("[rate-limit] RPC error:", error?.message || "No data returned")
            return { allowed: true, remaining: maxRequests, resetAt: new Date() }
        }

        return {
            allowed: data[0].allowed,
            remaining: data[0].remaining,
            resetAt: new Date(data[0].reset_at)
        }
    } catch (err) {
        console.error("[rate-limit] Unexpected error:", err)
        return { allowed: true, remaining: maxRequests, resetAt: new Date() }
    }
}

/**
 * Extract client IP from request headers
 * Handles x-forwarded-for with multiple proxies, private IPs, and edge cases
 */
export function getClientIp(request: Request): string {
    // Railway, Vercel, and most reverse proxies add x-forwarded-for
    const forwarded = request.headers.get("x-forwarded-for")

    if (forwarded) {
        // Take the first IP (original client), trim whitespace
        const firstIp = forwarded.split(",")[0]?.trim()

        // Validate it's a reasonable IP format (basic check)
        if (firstIp && isValidIp(firstIp)) {
            return firstIp
        }
    }

    // Fallback headers (some proxies use these)
    const realIp = request.headers.get("x-real-ip")?.trim()
    if (realIp && isValidIp(realIp)) {
        return realIp
    }

    // Last resort - return a fallback that still provides some grouping
    return "unknown"
}

/**
 * Basic IP validation - checks for valid IPv4 or IPv6 format
 * Also rejects obviously private/reserved ranges
 */
function isValidIp(ip: string): boolean {
    if (!ip || ip.length < 7 || ip.length > 45) {
        return false
    }

    // Reject localhost and private ranges
    if (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        ip.startsWith("172.16.") ||
        ip.startsWith("172.17.") ||
        ip.startsWith("172.18.") ||
        ip.startsWith("172.19.") ||
        ip.startsWith("172.20.") ||
        ip.startsWith("172.21.") ||
        ip.startsWith("172.22.") ||
        ip.startsWith("172.23.") ||
        ip.startsWith("172.24.") ||
        ip.startsWith("172.25.") ||
        ip.startsWith("172.26.") ||
        ip.startsWith("172.27.") ||
        ip.startsWith("172.28.") ||
        ip.startsWith("172.29.") ||
        ip.startsWith("172.30.") ||
        ip.startsWith("172.31.")
    ) {
        // For development/private networks, return a generic key
        return false
    }

    return true
}

/**
 * Generate rate limit response headers
 */
export function rateLimitHeaders(remaining: number, resetAt: Date): HeadersInit {
    const retryAfter = Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
    return {
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": Math.floor(resetAt.getTime() / 1000).toString(),
        "Retry-After": retryAfter.toString()
    }
}
