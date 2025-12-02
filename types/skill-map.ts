export type SkillPriority = "high" | "medium" | "low"
export type SkillCategory = "matched" | "transferable" | "missing"

export interface Skill {
  name: string
  priority: SkillPriority
  category: SkillCategory
  resumeEvidence?: string
  jobRequirement?: string
  matchPercentage?: number
  potentialScoreIncrease?: number
}

export interface RoadmapItem {
  skill: string
  importance: string
  firstStep: string
  potentialScoreIncrease: number
}

export interface AdaptationHighlight {
  skill: string
  originalPresentation: string
  adaptedPresentation: string
  improvement: string
}

export interface SkillMapData {
  matchScore: number
  matchedSkills: Skill[]
  transferableSkills: Skill[]
  missingSkills: Skill[]
  learningRoadmap: RoadmapItem[]
  summary: string
  interviewTips: string[]
  // Adaptation analysis (comparing original vs adapted resume)
  adaptationScore?: number
  adaptationHighlights?: AdaptationHighlight[]
  adaptationSummary?: string
}

export interface SkillMapRecord {
  id: string
  user_id: string
  resume_id?: string
  rewritten_resume_id: string
  match_score: number
  adaptation_score?: number
  data: SkillMapData
  created_at: string
  updated_at: string
  // Flattened from job_postings via rewritten_resumes for UI compatibility
  job_title?: string
  job_company?: string
}
