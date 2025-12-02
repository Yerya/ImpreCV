export interface JobPosting {
  id: string
  user_id: string
  title: string
  company?: string | null
  description?: string | null
  link?: string | null
  created_at: string
  updated_at: string
}
