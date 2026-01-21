import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSafeRedirectPath } from "@/lib/auth/redirect"

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = getSafeRedirectPath(searchParams.get("next") ?? searchParams.get("redirect_to"), "/dashboard")

  if (!token_hash || !type) {
    const url = new URL("/login", request.url)
    url.searchParams.set("error", "missing_params")
    return NextResponse.redirect(url)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const url = new URL("/login", request.url)
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
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  })

  if (error) {
    console.error("Auth confirmation error:", error.message)
    
    // Handle specific error cases
    if (error.message.includes("expired")) {
      const url = new URL("/login", request.url)
      url.searchParams.set("error", "link_expired")
      url.searchParams.set("message", "Your confirmation link has expired. Please request a new one.")
      return NextResponse.redirect(url)
    } else if (error.message.includes("invalid")) {
      const url = new URL("/login", request.url)
      url.searchParams.set("error", "invalid_token")
      url.searchParams.set("message", "Invalid confirmation link. Please try again.")
      return NextResponse.redirect(url)
    } else {
      const url = new URL("/login", request.url)
      url.searchParams.set("error", "verification_failed")
      url.searchParams.set("message", error.message)
      return NextResponse.redirect(url)
    }
  }

  // Special handling for password recovery
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/reset-password", request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}
