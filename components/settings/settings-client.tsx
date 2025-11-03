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
import { GlobalHeader } from "@/components/global-header"
import { Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUpdateProfileMutation, useDeleteAccountMutation } from "@/features/api/authApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"

interface SettingsClientProps {
  user: any
  profile: any
}

export default function SettingsClient({ user, profile: initialProfile }: SettingsClientProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [fullName, setFullName] = useState(initialProfile?.full_name || "")
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [updateProfile] = useUpdateProfileMutation()
  const [deleteAccount] = useDeleteAccountMutation()

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await updateProfile({ id: user.id, fullName })
      if ('data' in res && res.data?.ok) {
        router.refresh()
      } else {
        console.error("Profile update error:", (res as any))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await deleteAccount()
      if ('data' in res && res.data?.ok) {
        router.push("/login")
        router.refresh()
      }
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmText("")
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground intensity={0.5} className="fixed inset-0 z-0" />
      <AnimatedBackground intensity={0.4} className="fixed inset-0 z-0" />
      <GlobalHeader variant="back" backHref="/dashboard" backLabel="Back to Dashboard" />

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
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md glass-card">
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action is permanent. To confirm, type <span className="font-medium">Delete</span>.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="confirmDelete">Confirmation</Label>
                      <Input
                        id="confirmDelete"
                        placeholder="Delete"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setConfirmOpen(false)
                          setConfirmText("")
                        }}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={confirmText !== "Delete" || deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Confirm Delete"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
