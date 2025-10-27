"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, ArrowLeft, Download, Copy, CheckCircle2, Edit3, Eye } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { ThemeToggle } from "@/components/theme-toggle"

interface ResumeRewriteClientProps {
  rewrittenResume: any
  user: any
}

export default function ResumeRewriteClient({ rewrittenResume, user }: ResumeRewriteClientProps) {
  const [content, setContent] = useState(rewrittenResume.content)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setMousePosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

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
    a.download = `resume-${rewrittenResume.analyses?.job_postings?.title || "rewritten"}.md`
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/analysis/${rewrittenResume.analyses?.id}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Analysis</span>
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

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Rewritten Resume</span>
          </h1>
          <p className="text-muted-foreground">
            Optimized for {rewrittenResume.analyses?.job_postings?.title}
            {rewrittenResume.analyses?.job_postings?.company && ` at ${rewrittenResume.analyses.job_postings.company}`}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 relative overflow-hidden">
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)`,
                  transition: "background 0.1s ease-out",
                }}
              />
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/50 relative z-10">
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
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-card/50 backdrop-blur border-primary/20">
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
            {rewrittenResume.analyses?.match_score && (
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                <h3 className="text-lg font-semibold mb-4">Match Score</h3>
                <div className="text-center">
                  <div className="text-5xl font-bold gradient-text mb-2">{rewrittenResume.analyses.match_score}%</div>
                  <p className="text-sm text-muted-foreground">Compatibility with job posting</p>
                </div>
              </Card>
            )}

            {/* Tips */}
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
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
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
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
    </div>
  )
}
