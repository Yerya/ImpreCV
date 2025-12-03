-- Migration: Create Indexes
-- Version: 20251202000002
-- Description: Performance indexes for query optimization

-- Resumes indexes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_user_id_file_name_unique ON public.resumes(user_id, file_name);
CREATE INDEX IF NOT EXISTS idx_resumes_content_hash ON public.resumes(user_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);

-- Job postings indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_user_id ON public.job_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON public.job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_user_created_at ON public.job_postings(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_postings_user_link_unique ON public.job_postings(user_id, link) WHERE link IS NOT NULL AND link != '';
CREATE INDEX IF NOT EXISTS idx_job_postings_description_hash ON public.job_postings(user_id, description_hash) WHERE description_hash IS NOT NULL;

-- Rewritten resumes indexes
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_resume_id ON public.rewritten_resumes(resume_id);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_job_posting_id ON public.rewritten_resumes(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_user_created_at ON public.rewritten_resumes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_user_updated_at ON public.rewritten_resumes(user_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rewritten_resumes_resume_job_unique ON public.rewritten_resumes(resume_id, job_posting_id) WHERE resume_id IS NOT NULL AND job_posting_id IS NOT NULL;

-- Cover letters indexes
CREATE INDEX IF NOT EXISTS idx_cover_letters_rewritten_resume_id ON public.cover_letters(rewritten_resume_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_created_at ON public.cover_letters(user_id, created_at DESC);

-- Skill maps indexes
CREATE INDEX IF NOT EXISTS idx_skill_maps_user_id ON public.skill_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_maps_resume_id ON public.skill_maps(resume_id);
CREATE INDEX IF NOT EXISTS idx_skill_maps_rewritten_resume_id ON public.skill_maps(rewritten_resume_id);
CREATE INDEX IF NOT EXISTS idx_skill_maps_created_at ON public.skill_maps(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_maps_user_resume_unique ON public.skill_maps(user_id, rewritten_resume_id);

-- Chat usage indexes
CREATE INDEX IF NOT EXISTS idx_chat_usage_user_resume ON public.chat_usage(user_id, resume_id);
