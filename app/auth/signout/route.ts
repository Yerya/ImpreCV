import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getServerOrigin } from "@/lib/auth/redirect"

export async function POST(request: NextRequest) {
  const safeOrigin = getServerOrigin(request)

  // CSRF Check
  const originHeader = request.headers.get("origin")
  // Normalize safeOrigin to ensure we are comparing origins (no trailing slashes)
  const safeOriginValue = new URL(safeOrigin).origin

  if (originHeader && originHeader !== safeOriginValue) {
    console.warn("CSRF mismatch:", originHeader, "vs", safeOriginValue)
    // Optional: looser check if strict equality fails due to protocol mismatch in some edge cases
    // but usually exact match is required for security.
    return new NextResponse("Forbidden", { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login", safeOrigin), 303)
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

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL("/login", safeOrigin), 303)
}

export async function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: {
      Allow: "POST",
    },
  })
}
