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
import { formatDistanceToNow } from "date-fns"
import { Trash2, FileText, Loader2 } from "lucide-react"

export interface AdaptedResumeItem {
  id: string
  content: string
  resume_id?: string | null
  analysis_id?: string | null
  created_at?: string | null
}

interface Props {
  items: AdaptedResumeItem[]
  selectedId: string | null
  onUse: (item: AdaptedResumeItem) => void
  onDelete: (id: string) => void
  deletingId: string | null
}

export function AdaptedResumeList({ items, selectedId, onUse, onDelete, deletingId }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (!items?.length) {
    return (
      <Card className="glass-card p-4 text-sm text-muted-foreground">
        Saved adapted resumes will appear here.
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const preview = item.content.slice(0, 120)
        const createdAtLabel = item.created_at
          ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
          : "Recently saved"

        return (
          <Card
            key={item.id}
            className={`glass-card p-4 flex items-start gap-3 cursor-pointer border ${
              selectedId === item.id ? "border-primary/60" : "border-border/60"
            }`}
            onClick={() => onUse(item)}
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold truncate">Adapted resume</p>
                <span className="text-[11px] text-muted-foreground">{createdAtLabel}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{preview || "Empty content"}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation()
                setConfirmId(item.id)
              }}
              disabled={deletingId === item.id}
            >
              {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>

            <Dialog open={confirmId === item.id} onOpenChange={(open) => setConfirmId(open ? item.id : null)}>
              <DialogTrigger asChild>
                <div className="hidden" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-md glass-card" showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>Delete this adapted resume?</DialogTitle>
                  <DialogDescription>This will remove it permanently. You can re-run adaptation anytime.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmId(null)} disabled={deletingId === item.id}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onDelete(item.id)
                      setConfirmId(null)
                    }}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        )
      })}
    </div>
  )
}
