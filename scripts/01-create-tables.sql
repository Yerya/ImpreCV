-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table (original uploaded resumes)
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  content_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job postings table (normalized job vacancy data)
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  description TEXT,
  description_hash TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewritten resumes table (adapted resumes linked to job postings)
CREATE TABLE IF NOT EXISTS public.rewritten_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  structured_data JSONB,
  format TEXT DEFAULT 'json',
  variant TEXT DEFAULT 'tailored',
  theme TEXT DEFAULT 'light',
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
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill maps table (linked to rewritten_resumes, gets job info via join)
CREATE TABLE IF NOT EXISTS public.skill_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  rewritten_resume_id UUID NOT NULL REFERENCES public.rewritten_resumes(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0,
  adaptation_score INTEGER,
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
