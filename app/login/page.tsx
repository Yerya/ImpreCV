"use client"

import { useState, useEffect, Suspense } from "react"
import type React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { PasswordEyeIcon, PasswordEyeOffIcon } from "@/components/icons/password-eye"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { SupabaseBanner } from "@/components/supabase-banner"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSignInMutation } from "@/features/api/authApi"
import { BrandMark } from "@/components/brand-mark"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { getSafeRedirectPath } from "@/lib/auth/redirect"
import LoginSkeleton from "./login-skeleton"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [signIn] = useSignInMutation()

  const supabaseConfigured = isSupabaseConfigured()
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect"), "/dashboard")

  // Handle URL error and success messages from auth confirmation
  useEffect(() => {
    const urlError = searchParams.get("error")
    const urlMessage = searchParams.get("message")
    const confirmed = searchParams.get("confirmed")

    if (urlError && urlMessage) {
      setError(urlMessage)
    } else if (urlError === "link_expired") {
      setError("Your confirmation link has expired. Please request a new one.")
    } else if (urlError === "invalid_token") {
      setError("Invalid confirmation link. Please try again.")
    }

    if (confirmed === "true") {
      setSuccessMessage("Your email has been confirmed! You can now log in.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabaseConfigured) {
      setError("Supabase is not configured. Please connect Supabase integration.")
      return
    }

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await signIn({ email, password })
      if ('data' in res) {
        if (res.data?.ok) {
          router.push(redirectTo)
        } else {
          setError(res.data?.message || "Failed to log in")
        }
      } else if ('error' in res) {
        // Fallback, but should not happen since endpoint normalizes to data
        const resError = res.error as Record<string, unknown>
        const errMsg = (resError?.data as Record<string, unknown>)?.message as string || resError?.error as string || "Failed to log in"
        setError(errMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to home</span>
          </Link>
        </div>

        {!supabaseConfigured && (
          <div className="mb-6">
            <SupabaseBanner />
          </div>
        )}

        <Card className="glass-card p-8 relative z-10">
          <div className="flex items-center gap-1 mb-8">
            <BrandMark className="flex items-center gap-1" textClassName="text-2xl font-bold" />
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Log in to your account to continue</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!supabaseConfigured}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!supabaseConfigured}
                  className="bg-background/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <PasswordEyeOffIcon className="h-4 w-4" /> : <PasswordEyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {successMessage && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !supabaseConfigured}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground/70">or</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Google Sign In */}
            <GoogleSignInButton redirectTo={redirectTo} />
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-foreground hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
