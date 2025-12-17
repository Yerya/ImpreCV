"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, CheckCircle2, Trash2, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ResumeRecord {
  id: string
  file_name: string
  created_at: string
  [key: string]: unknown
}

interface ResumeListProps {
  resumes: ResumeRecord[]
  selectedResumeId: string | null
  onSelectResume: (id: string) => void
  onDeleteResume?: (id: string) => void
  deletingId?: string | null
}

export default function ResumeList({
  resumes,
  selectedResumeId,
  onSelectResume,
  onDeleteResume,
  deletingId = null,
}: ResumeListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

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
            className={`glass-row p-4 cursor-pointer ${selectedResumeId === resume.id ? "glass-row--selected" : ""
              }`}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate">{resume.file_name}</p>
                  <div className="flex items-center gap-2">
                    {selectedResumeId === resume.id && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                    {onDeleteResume && (
                      <Dialog open={confirmId === resume.id} onOpenChange={(open) => setConfirmId(open ? resume.id : null)}>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                            disabled={deletingId === resume.id}
                          >
                            {deletingId === resume.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md glass-card" showCloseButton={false}>
                          <DialogHeader>
                            <DialogTitle>Delete this resume?</DialogTitle>
                            <DialogDescription>
                              The file and its metadata will be removed. This cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmId(null)} disabled={deletingId === resume.id}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteResume(resume.id)
                                setConfirmId(null)
                              }}
                              disabled={deletingId === resume.id}
                            >
                              {deletingId === resume.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
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
