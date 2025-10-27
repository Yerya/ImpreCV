"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"

interface SettingsClientProps {
  user: any
  profile: any
}

export default function SettingsClient({ user, profile: initialProfile }: SettingsClientProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [fullName, setFullName] = useState(initialProfile?.full_name || "")
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id)

      if (error) throw error

      alert("Profile updated successfully!")
      router.refresh()
    } catch (error) {
      console.error("Profile update error:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground intensity={0.5} className="fixed inset-0 z-0" />
      <AnimatedBackground intensity={0.4} className="fixed inset-0 z-0" />
      {/* Header */}
      <header className="glass-header-drop relative">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span className="text-xl font-bold">CVify</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="glass-card p-6 relative z-10">
            <h2 className="text-2xl font-semibold mb-6">Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </Card>

          {/* Appearance */}
          <Card className="glass-card p-6 relative z-10">
            <h2 className="text-2xl font-semibold mb-6">Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </Card>

          {/* API Configuration */}
          <Card className="glass-card p-6 relative z-10">
            <h2 className="text-2xl font-semibold mb-6">API Configuration</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openaiKey">OpenAI API Key (Optional)</Label>
                <Input id="openaiKey" type="password" placeholder="sk-..." className="bg-background/50" disabled />
                <p className="text-xs text-muted-foreground">
                  Add your own OpenAI API key for unlimited analyses (Coming soon)
                </p>
              </div>
            </div>
          </Card>

          {/* Account Actions */}
          <Card className="glass-card p-6 relative z-10">
            <h2 className="text-2xl font-semibold mb-6">Account</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="font-medium">Account Status</p>
                  <p className="text-sm text-muted-foreground">Free Plan</p>
                </div>
                <Button variant="outline" className="bg-transparent">
                  Upgrade
                </Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" disabled>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
