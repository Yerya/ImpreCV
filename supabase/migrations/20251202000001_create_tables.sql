-- Migration: Create Tables
-- Version: 20251202000001
-- Description: Initial database schema for CVify application

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

-- Cover letters table (one per rewritten_resume)
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rewritten_resume_id UUID UNIQUE REFERENCES public.rewritten_resumes(id) ON DELETE CASCADE,
  content TEXT NOT NULL CONSTRAINT check_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill maps table (linked to rewritten_resumes)
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

-- Chat usage table (AI chat modification limits per user/resume)
CREATE TABLE IF NOT EXISTS public.chat_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id TEXT NOT NULL DEFAULT 'global',
  count INTEGER NOT NULL DEFAULT 0 CONSTRAINT check_count_non_negative CHECK (count >= 0),
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resume_id)
);

COMMENT ON TABLE public.chat_usage IS 'Tracks AI chat modification limits per user and resume. Records auto-expire after reset period.';
