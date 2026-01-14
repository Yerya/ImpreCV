"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { GlobalHeader } from "@/components/global-header"
import { Loader2, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setPaletteForTheme, setUiScale, type UiScale } from "@/features/app/appSlice"
import { signOutThunk } from "@/features/auth/authSlice"
import { SOLID_COLORS, type PaletteName } from "@/lib/theme/palettes"
import { useUpdateProfileMutation, useDeleteAccountMutation } from "@/features/api/authApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

interface UserData {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface ProfileData {
  id: string
  full_name?: string
  email?: string
}

interface SettingsClientProps {
  user: UserData
  profile: ProfileData | null
}

export default function SettingsClient({ user, profile: initialProfile }: SettingsClientProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [fullName, setFullName] = useState(initialProfile?.full_name || "")
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [updateProfile] = useUpdateProfileMutation()
  const [deleteAccount] = useDeleteAccountMutation()
  const dispatch = useAppDispatch()
  const paletteLight = useAppSelector((s) => s.app.paletteLight)
  const paletteDark = useAppSelector((s) => s.app.paletteDark)
  const uiScale = useAppSelector((s) => s.app.uiScale)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await updateProfile({ id: user.id, fullName })
      if ('data' in res && res.data?.ok) {
        router.refresh()
        toast.success("Profile updated")
      } else {
        console.error("Profile update error:", res)
        toast.error("Failed to update profile")
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
        await dispatch(signOutThunk())
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
    <div className="min-h-screen relative pb-20">
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

              {/* Interface scale */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Interface scale</p>
                    <p className="text-sm text-muted-foreground">Adjust the size of text and controls</p>
                  </div>
                </div>
                <UiScaleSection
                  current={uiScale}
                  onSelect={(scale) => dispatch(setUiScale(scale))}
                />
              </div>

              {/* Palette selection */}
              <div className="pt-4 space-y-4">
                {mounted && (() => {
                  const themeKey = theme === "dark" ? "dark" : "light" as const
                  const current = themeKey === "dark" ? paletteDark : paletteLight
                  return (
                    <PaletteSection
                      title="Palette"
                      current={current}
                      onSelect={(p) => dispatch(setPaletteForTheme({ theme: themeKey, palette: p }))}
                    />
                  )
                })()}
              </div>
            </div>
          </Card>

          {/* Account Actions */}
          <Card className="glass-card p-6 relative z-10">
            <h2 className="text-2xl font-semibold mb-4">Account</h2>
            <div className="space-y-4">
              <div className="flex items-start justify-between py-2 gap-4">
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

function UiScaleSection({
  current,
  onSelect,
}: {
  current: UiScale
  onSelect: (scale: UiScale) => void
}) {
  const options: { value: UiScale; label: string; hint: string }[] = [
    { value: "small", label: "Compact", hint: "More content, slightly smaller UI" },
    { value: "medium", label: "Default", hint: "Balanced scale" },
    { value: "large", label: "Comfortable", hint: "Larger text and controls" },
  ]

  return (
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={current === opt.value}
          onClick={() => onSelect(opt.value)}
          className={`glass-row flex items-center justify-between w-full rounded-md px-3 py-2 text-sm transition-colors ${current === opt.value ? "glass-row--selected" : ""
            }`}
        >
          <div className="flex flex-col items-start">
            <span className="font-medium">{opt.label}</span>
            <span className="text-xs text-muted-foreground">{opt.hint}</span>
          </div>
          {current === opt.value ? (
            <span className="text-[11px] uppercase tracking-wide text-primary/80 dark:text-primary/90">
              Active
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

function PaletteSection({
  title,
  current,
  onSelect,
}: {
  title: string
  current: PaletteName
  onSelect: (p: PaletteName) => void
}) {
  const options: { value: PaletteName; label: string }[] = [
    { value: "blue", label: "Blue" },
    { value: "raspberry", label: "Raspberry" },
    { value: "emerald", label: "Emerald" },
    { value: "violet", label: "Violet" },
    { value: "orange", label: "Orange" },
  ]

  const chip = (p: PaletteName) => {
    const color = SOLID_COLORS[p]
    return (
      <span
        aria-hidden
        className="inline-block h-4 w-8 rounded"
        style={{ background: color }}
      />
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`glass-row flex items-center justify-between w-full rounded-md px-3 py-2 text-sm transition-colors ${current === opt.value ? "glass-row--selected" : ""
              }`}
          >
            <span className="font-medium">{opt.label}</span>
            <span className="flex items-center gap-2">
              {chip(opt.value)}
              {current === opt.value ? (
                <Check className="h-4 w-4" style={{ color: SOLID_COLORS[opt.value] }} />
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
