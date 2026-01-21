import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSafeRedirectPath, getServerOrigin } from "@/lib/auth/redirect"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get("code")
  const next = getSafeRedirectPath(searchParams.get("next"), "/dashboard")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  const origin = getServerOrigin(request)

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription)
    // Use the computed origin for redirects
    const url = new URL("/login", origin)
    url.searchParams.set("error", "oauth_error")
    url.searchParams.set("message", errorDescription || "Failed to sign in with provider")
    return NextResponse.redirect(url)
  }

  if (!code) {
    const url = new URL("/login", origin)
    url.searchParams.set("error", "missing_code")
    return NextResponse.redirect(url)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const url = new URL("/login", origin)
    url.searchParams.set("error", "supabase_not_configured")
    return NextResponse.redirect(url)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignore errors from Server Components
        }
      },
    },
  })

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("Code exchange error:", exchangeError.message)
    const url = new URL("/login", origin)
    url.searchParams.set("error", "exchange_failed")
    url.searchParams.set("message", exchangeError.message)
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(new URL(next, origin))
}
