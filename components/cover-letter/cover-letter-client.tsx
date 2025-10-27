"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, ArrowLeft, Download, Copy, CheckCircle2, Edit3, Eye, Mail } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface CoverLetterClientProps {
  coverLetter: any
  user: any
}

export default function CoverLetterClient({ coverLetter, user }: CoverLetterClientProps) {
  const [content, setContent] = useState(coverLetter.content)
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
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cover-letter-${coverLetter.analyses?.job_postings?.title || "generated"}.txt`
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
            href={`/analysis/${coverLetter.analyses?.id}`}
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
            <span className="gradient-text">Cover Letter</span>
          </h1>
          <p className="text-muted-foreground">
            Personalized for {coverLetter.analyses?.job_postings?.title}
            {coverLetter.analyses?.job_postings?.company && ` at ${coverLetter.analyses.job_postings.company}`}
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
              <div className="relative z-10">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-card/50 backdrop-blur border-primary/20">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                <Button onClick={handleDownload} className="w-full justify-start" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download Letter
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

            {/* Job Details */}
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <h3 className="text-lg font-semibold mb-4">Job Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Position</p>
                  <p className="font-medium">{coverLetter.analyses?.job_postings?.title}</p>
                </div>
                {coverLetter.analyses?.job_postings?.company && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Company</p>
                    <p className="font-medium">{coverLetter.analyses.job_postings.company}</p>
                  </div>
                )}
                {coverLetter.analyses?.match_score && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Match Score</p>
                    <p className="text-2xl font-bold gradient-text">{coverLetter.analyses.match_score}%</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Writing Tips */}
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <h3 className="text-lg font-semibold mb-4">Writing Tips</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Personalize the opening with specific details about the company</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Include concrete examples of your relevant achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Show enthusiasm for the role and company mission</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Keep it concise - aim for 3-4 paragraphs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>End with a clear call to action</span>
                </li>
              </ul>
            </Card>

            {/* Structure Guide */}
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <h3 className="text-lg font-semibold mb-4">Cover Letter Structure</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-1">Opening</p>
                  <p className="text-muted-foreground">Express interest and mention how you found the position</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Body</p>
                  <p className="text-muted-foreground">Highlight relevant skills and experiences with examples</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Closing</p>
                  <p className="text-muted-foreground">Thank them and express interest in next steps</p>
                </div>
              </div>
            </Card>

            {/* Email Template */}
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Email Template</h3>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Subject:</strong> Application for{" "}
                  {coverLetter.analyses?.job_postings?.title}
                </p>
                <p className="pt-2">
                  <strong className="text-foreground">Tip:</strong> Attach your resume and paste the cover letter in the
                  email body
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
