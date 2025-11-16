"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileText, Link2 } from "lucide-react"

interface JobPostingFormProps {
  jobPosting: {
    title: string
    company: string
    description: string
    jobLink: string
    inputType: "paste" | "link"
  }
  onChange: (jobPosting: any) => void
}

export default function JobPostingForm({ jobPosting, onChange }: JobPostingFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Job Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Senior Software Engineer"
          value={jobPosting.title}
          onChange={(e) => onChange({ ...jobPosting, title: e.target.value })}
          className="bg-background/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          placeholder="e.g. Tech Corp"
          value={jobPosting.company}
          onChange={(e) => onChange({ ...jobPosting, company: e.target.value })}
          className="bg-background/50"
        />
      </div>

      <div className="space-y-3">
        <Label>Job Details *</Label>
        <div className="flex flex-col sm:flex-row gap-2 p-1 bg-secondary/30 rounded-lg">
          <Button
            type="button"
            variant={jobPosting.inputType === "paste" ? "default" : "ghost"}
            size="sm"
            className="flex-1 whitespace-normal text-sm sm:text-xs md:text-sm"
            onClick={() => onChange({ ...jobPosting, inputType: "paste", jobLink: "" })}
          >
            <FileText className="h-4 w-4 mr-2" />
            Paste Description
          </Button>
          <Button
            type="button"
            variant={jobPosting.inputType === "link" ? "default" : "ghost"}
            size="sm"
            className="flex-1 whitespace-normal text-sm sm:text-xs md:text-sm"
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
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              We'll automatically fetch and parse the job posting from the link
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
