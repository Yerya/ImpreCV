"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { GlobalHeader } from "@/components/global-header"
import { Download, Copy, CheckCircle2, Edit3, Eye, Mail } from "lucide-react"

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
    <div className="min-h-screen relative">
      <GlobalHeader 
        variant="back" 
        backHref={`/analysis/${coverLetter.analyses?.id}`} 
        backLabel="Back to Analysis" 
      />

      <div className="container mx-auto px-4 py-8 relative z-10">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="glass-card-primary p-6 relative z-10">
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
            <Card className="glass-card p-6 relative z-10">
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
            <Card className="glass-card p-6 relative z-10">
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
            <Card className="glass-card p-6 relative z-10">
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
            <Card className="glass-card p-6 relative z-10">
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
