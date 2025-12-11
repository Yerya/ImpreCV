"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { GlobalHeader } from "@/components/global-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Download, Copy, CheckCircle2, Edit3, Eye } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface RewrittenResume {
  id: string
  content: string
  job_title?: string
  job_company?: string
}

interface ResumeRewriteClientProps {
  rewrittenResume: RewrittenResume
}

export default function ResumeRewriteClient({ rewrittenResume }: ResumeRewriteClientProps) {
  const [content, setContent] = useState(rewrittenResume.content)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resume-${rewrittenResume.job_title || "rewritten"}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/resume-rewrite/${rewrittenResume.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) throw new Error("Failed to save")

      setIsEditing(false)
    } catch (error) {
      console.error("Save error:", error)
      alert("Failed to save changes. Please try again.")
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

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Adapted Resume</span>
          </h1>
          {(rewrittenResume.job_title || rewrittenResume.job_company) && (
            <p className="text-muted-foreground">
              Optimized for {rewrittenResume.job_title}
              {rewrittenResume.job_company && ` at ${rewrittenResume.job_company}`}
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
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
                  {isEditing ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-transparent">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Content */}
              {isEditing ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={25}
                  className="font-mono text-sm bg-background/50"
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 text-foreground">{children}</h1>,
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold mt-8 mb-3 text-foreground">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-semibold mt-6 mb-2 text-foreground">{children}</h3>
                      ),
                      p: ({ children }) => <p className="mb-4 text-muted-foreground leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                      li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="glass-card-primary p-6 relative z-10">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                <Button onClick={handleDownload} className="w-full justify-start" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download Resume
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="lg"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Match Score */}
            {rewrittenResume.job_title && (
              <Card className="glass-card p-6 relative z-10">
                <h3 className="text-lg font-semibold mb-4">Job Details</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Position:</span>{" "}
                    <span className="font-medium">{rewrittenResume.job_title}</span>
                  </p>
                  {rewrittenResume.job_company && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Company:</span>{" "}
                      <span className="font-medium">{rewrittenResume.job_company}</span>
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Tips */}
            <Card className="glass-card p-6 relative z-10">
              <h3 className="text-lg font-semibold mb-4">Customization Tips</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Add specific metrics and achievements from your experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Tailor the professional summary to match the job description</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Include relevant keywords naturally throughout</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Keep formatting consistent and professional</span>
                </li>
              </ul>
            </Card>

            {/* Export Formats */}
            <Card className="glass-card p-6 relative z-10">
              <h3 className="text-lg font-semibold mb-4">Export Formats</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Currently available in Markdown format. Copy the content and paste into your preferred document editor.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Tip:</strong> Use tools like Pandoc or online converters to
                  convert to PDF or DOCX
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
