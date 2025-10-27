"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Sparkles, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { SupabaseBanner } from "@/components/supabase-banner"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  const supabaseConfigured = isSupabaseConfigured()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setMousePosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabaseConfigured) {
      setError("Supabase is not configured. Please connect Supabase integration.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(99, 102, 241, 0.5) 0%, transparent 50%)`,
            transition: "background 0.1s ease-out",
          }}
        />
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 0.7 + 15}% ${mousePosition.y * 0.7 + 15}%, rgba(139, 92, 246, 0.4) 0%, transparent 40%)`,
            transition: "background 0.15s ease-out",
          }}
        />
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <Card className="p-8 bg-card/80 backdrop-blur border-border/50 max-w-md w-full text-center relative z-10">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Password Updated!</h2>
          <p className="text-muted-foreground mb-6">Redirecting you to your dashboard...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(99, 102, 241, 0.5) 0%, transparent 50%)`,
          transition: "background 0.1s ease-out",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 0.7 + 15}% ${mousePosition.y * 0.7 + 15}%, rgba(139, 92, 246, 0.4) 0%, transparent 40%)`,
          transition: "background 0.15s ease-out",
        }}
      />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to login</span>
          </Link>
        </div>

        {!supabaseConfigured && (
          <div className="mb-6">
            <SupabaseBanner />
          </div>
        )}

        <Card className="p-8 bg-card/80 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6" />
            <span className="text-2xl font-bold">CVify</span>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Reset your password</h1>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={!supabaseConfigured}
                className="bg-background/50"
              />
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
                  Updating password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
