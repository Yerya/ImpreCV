"use client"

import { useState } from "react"
import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Sparkles, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { SupabaseBanner } from "@/components/supabase-banner"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSignUpMutation } from "@/features/api/authApi"

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [signUp] = useSignUpMutation()

  const supabaseConfigured = isSupabaseConfigured()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabaseConfigured) {
      setError("Supabase is not configured. Please connect Supabase integration.")
      return
    }

    if (!fullName || !email || !password) {
      setError("Please fill in all fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`
      const res = await signUp({ fullName, email, password, redirectTo })
      if ('data' in res) {
        if (res.data?.ok) {
      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
        } else {
          setError(res.data?.message || "Failed to sign up")
        }
      } else if ('error' in res) {
        const errMsg = (res.error as any)?.data?.message || (res.error as any)?.error || "Failed to sign up"
        setError(errMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <Card className="glass-card p-8 max-w-md w-full text-center relative z-10">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
          <p className="text-muted-foreground mb-6">Redirecting you to your dashboard...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </Card>
      </div>
    )
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
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6" />
            <span className="text-2xl font-bold">CVify</span>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground">Start optimizing your job applications today</p>
          </div>
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Yerya Kravchenko"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={!supabaseConfigured}
                className="bg-background/50"
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={!supabaseConfigured}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !supabaseConfigured}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground hover:underline font-medium">
              Log in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
