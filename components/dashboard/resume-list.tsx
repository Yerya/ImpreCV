"use client"

import { Card } from "@/components/ui/card"
import { FileText, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ResumeListProps {
  resumes: any[]
  selectedResumeId: string | null
  onSelectResume: (id: string) => void
}

export default function ResumeList({ resumes, selectedResumeId, onSelectResume }: ResumeListProps) {
  if (resumes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No resumes uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Your Resumes</p>
      <div className="space-y-2">
        {resumes.map((resume) => (
          <Card
            key={resume.id}
            onClick={() => onSelectResume(resume.id)}
            className={`p-4 cursor-pointer transition-all ${
              selectedResumeId === resume.id
                ? "bg-primary/10 border-primary/50"
                : "bg-background/50 hover:bg-background/80 border-border/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate">{resume.file_name}</p>
                  {selectedResumeId === resume.id && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uploaded {formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
