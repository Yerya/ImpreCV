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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewritten resumes table (adapted resumes with job context)
CREATE TABLE IF NOT EXISTS public.rewritten_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  structured_data JSONB,
  format TEXT DEFAULT 'json',
  variant TEXT DEFAULT 'tailored',
  theme TEXT DEFAULT 'light',
  pdf_url TEXT,
  pdf_path TEXT,
  file_name TEXT,
  job_description TEXT,
  job_link TEXT,
  job_title TEXT,
  job_company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cover letters table
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  job_title TEXT,
  job_company TEXT,
  rewritten_resume_id UUID REFERENCES public.rewritten_resumes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill maps table (analyzes original resume vs job, with adaptation comparison)
CREATE TABLE IF NOT EXISTS public.skill_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  rewritten_resume_id UUID NOT NULL REFERENCES public.rewritten_resumes(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0,
  adaptation_score INTEGER,
  data JSONB NOT NULL,
  job_title TEXT,
  job_company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_user_id_file_name_unique ON public.resumes(user_id, file_name);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_resume_id ON public.rewritten_resumes(resume_id);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_user_created_at ON public.rewritten_resumes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_user_updated_at ON public.rewritten_resumes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewritten_resumes_job_title ON public.rewritten_resumes(job_title);
CREATE INDEX IF NOT EXISTS idx_cover_letters_rewritten_resume_id ON public.cover_letters(rewritten_resume_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_created_at ON public.cover_letters(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_maps_user_id ON public.skill_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_maps_resume_id ON public.skill_maps(resume_id);
CREATE INDEX IF NOT EXISTS idx_skill_maps_rewritten_resume_id ON public.skill_maps(rewritten_resume_id);
CREATE INDEX IF NOT EXISTS idx_skill_maps_created_at ON public.skill_maps(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_maps_user_resume_unique ON public.skill_maps(user_id, rewritten_resume_id);
