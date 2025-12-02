-- CVify Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table (original uploaded resumes)
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL CONSTRAINT check_file_name_not_empty CHECK (LENGTH(TRIM(file_name)) > 0),
  file_url TEXT NOT NULL,
  file_size INTEGER CONSTRAINT check_file_size_positive CHECK (file_size IS NULL OR file_size > 0),
  extracted_text TEXT,
  content_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job postings table (normalized job vacancy data)
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CONSTRAINT check_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  company TEXT,
  description TEXT,
  description_hash TEXT,
  link TEXT CONSTRAINT check_link_format CHECK (link IS NULL OR link = '' OR link ~* '^https?://'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewritten resumes table (adapted resumes linked to job postings)
CREATE TABLE IF NOT EXISTS public.rewritten_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  content TEXT NOT NULL CONSTRAINT check_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  structured_data JSONB,
  format TEXT DEFAULT 'json' CONSTRAINT check_format_valid CHECK (format IN ('json', 'text', 'markdown')),
  variant TEXT DEFAULT 'tailored' CONSTRAINT check_variant_valid CHECK (variant IN ('tailored', 'original', 'optimized')),
  theme TEXT DEFAULT 'light' CONSTRAINT check_theme_valid CHECK (theme IN ('light', 'dark', 'modern', 'classic', 'minimal')),
  pdf_url TEXT,
  pdf_path TEXT,
  file_name TEXT,
  last_adapted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cover letters table (one per rewritten_resume, gets job info via join)
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rewritten_resume_id UUID UNIQUE REFERENCES public.rewritten_resumes(id) ON DELETE CASCADE,
  content TEXT NOT NULL CONSTRAINT check_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill maps table (linked to rewritten_resumes, gets job info via join)
CREATE TABLE IF NOT EXISTS public.skill_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  rewritten_resume_id UUID NOT NULL REFERENCES public.rewritten_resumes(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0 CONSTRAINT check_match_score CHECK (match_score >= 0 AND match_score <= 100),
  adaptation_score INTEGER CONSTRAINT check_adaptation_score CHECK (adaptation_score IS NULL OR (adaptation_score >= 0 AND adaptation_score <= 100)),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_user_id_file_name_unique ON public.resumes(user_id, file_name);
CREATE INDEX IF NOT EXISTS idx_resumes_content_hash ON public.resumes(user_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_user_id ON public.job_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON public.job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_user_created_at ON public.job_postings(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_postings_user_link_unique ON public.job_postings(user_id, link) WHERE link IS NOT NULL AND link != '';
CREATE INDEX IF NOT EXISTS idx_job_postings_description_hash ON public.job_postings(user_id, description_hash) WHERE description_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_resume_id ON public.rewritten_resumes(resume_id);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_job_posting_id ON public.rewritten_resumes(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_user_created_at ON public.rewritten_resumes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_user_updated_at ON public.rewritten_resumes(user_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rewritten_resumes_resume_job_unique ON public.rewritten_resumes(resume_id, job_posting_id) WHERE resume_id IS NOT NULL AND job_posting_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cover_letters_rewritten_resume_id ON public.cover_letters(rewritten_resume_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_created_at ON public.cover_letters(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_maps_user_id ON public.skill_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_maps_resume_id ON public.skill_maps(resume_id);
CREATE INDEX IF NOT EXISTS idx_skill_maps_rewritten_resume_id ON public.skill_maps(rewritten_resume_id);
CREATE INDEX IF NOT EXISTS idx_skill_maps_created_at ON public.skill_maps(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_maps_user_resume_unique ON public.skill_maps(user_id, rewritten_resume_id);

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewritten_resumes_updated_at
  BEFORE UPDATE ON public.rewritten_resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cover_letters_updated_at
  BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skill_maps_updated_at
  BEFORE UPDATE ON public.skill_maps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VIEW: Combined dashboard data
CREATE OR REPLACE VIEW public.resume_job_analysis
WITH (security_invoker = true)
AS SELECT 
  rr.id,
  rr.user_id,
  rr.created_at,
  rr.updated_at,
  rr.last_adapted_at,
  rr.variant,
  rr.theme,
  rr.pdf_url,
  rr.file_name,
  r.id as original_resume_id,
  r.file_name as resume_name,
  r.file_url as resume_file_url,
  jp.id as job_posting_id,
  jp.title as job_title,
  jp.company as job_company,
  jp.link as job_link,
  sm.id as skill_map_id,
  sm.match_score,
  sm.adaptation_score,
  cl.id as cover_letter_id,
  CASE WHEN cl.id IS NOT NULL THEN true ELSE false END as has_cover_letter
FROM public.rewritten_resumes rr
LEFT JOIN public.resumes r ON rr.resume_id = r.id
LEFT JOIN public.job_postings jp ON rr.job_posting_id = jp.id
LEFT JOIN public.skill_maps sm ON sm.rewritten_resume_id = rr.id
LEFT JOIN public.cover_letters cl ON cl.rewritten_resume_id = rr.id;

-- VIEW: User statistics
CREATE OR REPLACE VIEW public.user_statistics
WITH (security_invoker = true)
AS SELECT 
  p.id as user_id,
  p.created_at as member_since,
  COUNT(DISTINCT res.id) as total_resumes,
  COUNT(DISTINCT jp.id) as total_job_postings,
  COUNT(DISTINCT rr.id) as total_adapted_resumes,
  COUNT(DISTINCT cl.id) as total_cover_letters,
  COUNT(DISTINCT sm.id) as total_skill_analyses,
  COALESCE(AVG(sm.match_score), 0)::INTEGER as avg_match_score,
  MAX(rr.updated_at) as last_activity
FROM public.profiles p
LEFT JOIN public.resumes res ON res.user_id = p.id
LEFT JOIN public.job_postings jp ON jp.user_id = p.id
LEFT JOIN public.rewritten_resumes rr ON rr.user_id = p.id
LEFT JOIN public.cover_letters cl ON cl.user_id = p.id
LEFT JOIN public.skill_maps sm ON sm.user_id = p.id
GROUP BY p.id, p.created_at;

-- VIEW: Masked profiles (for reports, GDPR compliance)
CREATE OR REPLACE VIEW public.profiles_masked
WITH (security_invoker = true)
AS SELECT 
  id,
  CONCAT(LEFT(email, 2), '***@', SUBSTRING(email FROM POSITION('@' IN email) + 1)) as email_masked,
  CASE 
    WHEN full_name IS NOT NULL AND LENGTH(full_name) > 0
    THEN CONCAT(LEFT(full_name, 1), '***')
    ELSE NULL 
  END as full_name_masked,
  CASE WHEN avatar_url IS NOT NULL THEN '[HIDDEN]' ELSE NULL END as avatar_status,
  created_at,
  updated_at
FROM public.profiles;

-- VIEW: Detailed skill analysis
CREATE OR REPLACE VIEW public.skill_analysis_details
WITH (security_invoker = true)
AS SELECT 
  sm.id,
  sm.user_id,
  sm.match_score,
  sm.adaptation_score,
  sm.data,
  sm.created_at,
  sm.updated_at,
  r.file_name as original_resume_name,
  rr.file_name as adapted_resume_name,
  rr.variant,
  jp.title as job_title,
  jp.company as job_company,
  jp.link as job_link,
  CASE 
    WHEN sm.adaptation_score IS NOT NULL 
    THEN sm.adaptation_score - sm.match_score 
    ELSE NULL 
  END as score_improvement
FROM public.skill_maps sm
LEFT JOIN public.resumes r ON sm.resume_id = r.id
LEFT JOIN public.rewritten_resumes rr ON sm.rewritten_resume_id = rr.id
LEFT JOIN public.job_postings jp ON rr.job_posting_id = jp.id;

-- VIEW: Job match summary
CREATE OR REPLACE VIEW public.job_match_summary
WITH (security_invoker = true)
AS SELECT 
  jp.id as job_posting_id,
  jp.user_id,
  jp.title,
  jp.company,
  jp.link,
  jp.created_at,
  COUNT(rr.id) as adapted_resumes_count,
  MAX(sm.match_score) as best_match_score,
  MAX(sm.adaptation_score) as best_adaptation_score,
  BOOL_OR(cl.id IS NOT NULL) as has_cover_letter
FROM public.job_postings jp
LEFT JOIN public.rewritten_resumes rr ON rr.job_posting_id = jp.id
LEFT JOIN public.skill_maps sm ON sm.rewritten_resume_id = rr.id
LEFT JOIN public.cover_letters cl ON cl.rewritten_resume_id = rr.id
GROUP BY jp.id, jp.user_id, jp.title, jp.company, jp.link, jp.created_at;
