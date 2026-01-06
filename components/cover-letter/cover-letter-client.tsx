"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { GlobalHeader } from "@/components/global-header"
import { Download, Copy, CheckCircle2, Edit3, Eye, X, Save } from "lucide-react"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

interface CoverLetterData {
  id: string
  content: string
  job_title?: string
  job_company?: string
}

interface CoverLetterClientProps {
  coverLetter: CoverLetterData
}

export default function CoverLetterClient({ coverLetter }: CoverLetterClientProps) {
  const [content, setContent] = useState(coverLetter.content)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const isMobile = useIsMobile()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success("Copied to clipboard")
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
    toast.success("Downloaded")
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
    } catch (error: unknown) {
      const err = error as Error
      console.error("Save error:", error)
      toast.error(err?.message || "Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen relative pb-24 md:pb-20">
      <GlobalHeader
        variant="back"
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 relative z-10 max-w-4xl">
        {/* Header Section */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">
            <span className="gradient-text">Cover Letter</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {coverLetter.job_title && `Personalized for ${coverLetter.job_title}`}
            {coverLetter.job_company && ` at ${coverLetter.job_company}`}
          </p>
        </div>

        {/* Main Content */}
        <Card className="glass-card p-4 md:p-8 relative z-10">
          {/* Toolbar - Desktop */}
          {!isMobile && (
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
          )}

          {/* Toolbar - Mobile */}
          {isMobile && (
            <div className="mb-4 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {isEditing ? (
                    <><Edit3 className="h-3.5 w-3.5" /><span>Editing</span></>
                  ) : (
                    <><Eye className="h-3.5 w-3.5" /><span>Preview</span></>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleDownload} variant="outline" size="sm" className="flex-1 h-9">
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </Button>
                <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1 h-9">
                  {copied ? (
                    <><CheckCircle2 className="h-4 w-4 mr-1.5" />Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1.5" />Copy</>
                  )}
                </Button>
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="h-9" onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-1.5" />
                      {saving ? "..." : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button variant="default" size="sm" className="h-9" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={isMobile ? 15 : 20}
                className="font-sans text-sm md:text-base bg-background/50 leading-relaxed"
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm md:text-base text-muted-foreground leading-relaxed">{content}</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
