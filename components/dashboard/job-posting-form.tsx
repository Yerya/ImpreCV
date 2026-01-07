"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileText, Link2, AlertTriangle } from "lucide-react"
import { isRestrictedJobSite } from "@/lib/job-posting"

interface JobPostingFormProps {
  jobPosting: {
    description: string
    jobLink: string
    inputType: "paste" | "link"
  }
  onChange: (jobPosting: { description: string; jobLink: string; inputType: "paste" | "link" }) => void
}

export default function JobPostingForm({ jobPosting, onChange }: JobPostingFormProps) {
  // Check if the current URL is from a restricted site (e.g., LinkedIn)
  const restrictedSiteWarning = useMemo(() => {
    if (jobPosting.inputType !== "link" || !jobPosting.jobLink.trim()) {
      return null
    }
    const result = isRestrictedJobSite(jobPosting.jobLink)
    return result.isRestricted ? result.message : null
  }, [jobPosting.inputType, jobPosting.jobLink])

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Job Details *</Label>
        <p className="text-xs text-muted-foreground">We will detect the role and company from your paste or link.</p>
        <div className="flex flex-col sm:flex-row gap-2 p-1 bg-secondary/30 rounded-lg">
          <Button
            type="button"
            variant={jobPosting.inputType === "paste" ? "default" : "ghost"}
            className="flex-1 h-11 sm:h-10 whitespace-normal text-sm"
            onClick={() => onChange({ ...jobPosting, inputType: "paste", jobLink: "" })}
          >
            <FileText className="h-4 w-4 mr-2" />
            Paste Description
          </Button>
          <Button
            type="button"
            variant={jobPosting.inputType === "link" ? "default" : "ghost"}
            className="flex-1 h-11 sm:h-10 whitespace-normal text-sm"
            onClick={() => onChange({ ...jobPosting, inputType: "link", description: "" })}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Insert Job Link
          </Button>
        </div>

        {jobPosting.inputType === "paste" ? (
          <div className="space-y-2">
            <Textarea
              id="description"
              placeholder="Paste the full job description here..."
              value={jobPosting.description}
              onChange={(e) => onChange({ ...jobPosting, description: e.target.value })}
              rows={10}
              className="bg-background/50 resize-none"
            />
            <p className="text-xs text-muted-foreground">Include requirements, responsibilities, and qualifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              id="jobLink"
              type="url"
              placeholder="https://example.com/jobs/senior-engineer"
              value={jobPosting.jobLink}
              onChange={(e) => onChange({ ...jobPosting, jobLink: e.target.value })}
              className={`bg-background/50 ${restrictedSiteWarning ? "border-amber-500 focus-visible:ring-amber-500" : ""}`}
            />
            {restrictedSiteWarning ? (
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {restrictedSiteWarning}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                We&apos;ll automatically fetch and parse the job posting from the link
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
