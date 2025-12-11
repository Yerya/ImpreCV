"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Loader2, CheckCircle2, FileText, FileType } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ResumeUploadProps {
  onResumeUploaded: (resume: Record<string, unknown>) => void
  onTextChange?: (text: string) => void
  textValue?: string
  currentCount?: number
  maxResumes?: number
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export default function ResumeUpload({
  onResumeUploaded,
  onTextChange,
  textValue,
  currentCount = 0,
  maxResumes = 3,
}: ResumeUploadProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload")
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [text, setText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isValidFileType = (file: File) => {
    const allowedExtensions = [".pdf", ".doc", ".docx", ".txt"]
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ]
    const lowerName = file.name.toLowerCase()
    return allowedTypes.includes(file.type) || allowedExtensions.some((ext) => lowerName.endsWith(ext))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (!isValidFileType(file)) {
      setUploadError("Please upload a PDF, DOCX, or TXT file.")
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError("File size must be less than 5MB.")
      return
    }

    if (currentCount >= maxResumes) {
      setUploadError(`You can upload up to ${maxResumes} resumes.`)
      return
    }

    setUploading(true)
    setUploadSuccess(false)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("fileName", file.name)

      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      })

      const contentType = response.headers.get("content-type") || ""
      const rawText = await response.clone().text().catch(() => "")

      const parseResponse = async () => {
        if (contentType.includes("application/json")) {
          return response.json()
        }
        if (rawText) {
          try {
            return JSON.parse(rawText)
          } catch {
            return { error: rawText }
          }
        }
        return { error: "Unexpected server response" }
      }

      const data = await parseResponse()

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error.trim()) ||
          `Upload failed (status ${response.status})`
        setUploadError(message)
        toast.error(message)
        return
      }

      setUploadSuccess(true)
      onResumeUploaded(data.resume)
      toast.success("Resume uploaded")

      setTimeout(() => {
        setUploadSuccess(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }, 2000)
    } catch (error: unknown) {
      const err = error as Error
      console.error("Upload error:", error)
      const message = err?.message || "Failed to upload resume. Please try again."

      if (message.includes("upload up to 3 resumes") || message.includes("limit")) {
        setUploadError("limit_reached")
      } else {
        setUploadError(message)
        toast.error(message)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    if (textValue === undefined) {
      setText(newText)
    }
    if (onTextChange) {
      onTextChange(newText)
    }
  }

  const displayText = textValue ?? text

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-secondary/30 rounded-lg">
        <Button
          variant={mode === "upload" ? "default" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setMode("upload")}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        <Button
          variant={mode === "paste" ? "default" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setMode("paste")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Paste Text
        </Button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-background/50"
          >
            {uploadSuccess ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Resume uploaded successfully!</p>
              </div>
            ) : uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading your resume...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileType className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Click to upload your resume</p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, or TXT (max 5MB, up to {maxResumes} files)
                  </p>
                </div>
              </div>
            )}
          </div>
          {uploadError === "limit_reached" ? (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
              <p className="font-medium mb-1">Resume limit reached</p>
              <p className="mb-2">You can keep up to 3 resumes. Please delete one from the list below.</p>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive"
                onClick={() => {
                  const listElement = document.getElementById("resume-list-section")
                  if (listElement) {
                    listElement.scrollIntoView({ behavior: "smooth" })
                  }
                }}
              >
                View Resumes
              </Button>
            </div>
          ) : uploadError && (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
              {uploadError}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="Paste your resume content here..."
            className="min-h-[200px] bg-background/50 resize-none"
            value={displayText}
            onChange={handleTextChange}
          />
          <p className="text-xs text-muted-foreground">
            Paste the full text of your resume. We&apos;ll analyze it directly.
          </p>
        </div>
      )}
    </div>
  )
}
