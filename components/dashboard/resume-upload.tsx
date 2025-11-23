"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Loader2, CheckCircle2, FileText, FileType } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface ResumeUploadProps {
  onResumeUploaded: (resume: any) => void
  onTextChange?: (text: string) => void
}

export default function ResumeUpload({ onResumeUploaded, onTextChange }: ResumeUploadProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload")
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [text, setText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or Word document")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    setUploading(true)
    setUploadSuccess(false)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from("resumes").upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("resumes").getPublicUrl(fileName)

      // Extract text from file (in production, this would be done server-side)
      const extractedText = await extractTextFromFile(file)

      // Save to database
      const { data: resumeData, error: dbError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          extracted_text: extractedText,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setUploadSuccess(true)
      onResumeUploaded(resumeData)

      // Reset after 2 seconds
      setTimeout(() => {
        setUploadSuccess(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }, 2000)
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload resume. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const extractTextFromFile = async (file: File): Promise<string> => {
    // Placeholder - in production, use a proper PDF/DOCX parser
    return `Extracted text from ${file.name}`
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    if (onTextChange) {
      onTextChange(newText)
    }
  }

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
            accept=".pdf,.doc,.docx"
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
                  <p className="text-xs text-muted-foreground">PDF or Word document (max 5MB)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="Paste your resume content here..."
            className="min-h-[200px] bg-background/50 resize-none"
            value={text}
            onChange={handleTextChange}
          />
          <p className="text-xs text-muted-foreground">
            Paste the full text of your resume. We'll analyze it directly.
          </p>
        </div>
      )}
    </div>
  )
}
