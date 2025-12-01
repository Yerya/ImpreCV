"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { GlobalHeader } from "@/components/global-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Download, Copy, CheckCircle2, Edit3, Eye, Mail } from "lucide-react"
import { toast } from "sonner"

interface CoverLetterClientProps {
  coverLetter: any
  user: any
}

export default function CoverLetterClient({ coverLetter, user }: CoverLetterClientProps) {
  const [content, setContent] = useState(coverLetter.content)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cover-letter-${coverLetter.job_title || "generated"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/cover-letter/${coverLetter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save")
      }

      setIsEditing(false)
      toast.success("Cover letter saved successfully")
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error(error?.message || "Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen relative pb-20">
      <GlobalHeader
        variant="back"
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Cover Letter</span>
          </h1>
          <p className="text-muted-foreground">
            {coverLetter.job_title && `Personalized for ${coverLetter.job_title}`}
            {coverLetter.job_company && ` at ${coverLetter.job_company}`}
          </p>
        </div>

        {/* Main Content */}
        <Card className="glass-card p-8 relative z-10">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/50">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Edit3 className="h-4 w-4" />
                  <span>Editing Mode</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>Preview Mode</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm" className="bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="bg-transparent"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="font-sans text-base bg-background/50 leading-relaxed"
              />
            ) : (
              <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{content}</div>
            )}
          </div>
        </Card>
      </div>
      <MobileBottomNav />
    </div>
  )
}
