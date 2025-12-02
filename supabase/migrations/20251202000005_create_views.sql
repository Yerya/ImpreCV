-- Migration: Create Views
-- Version: 20251202000005
-- Description: Database views for complex queries and reporting
-- Note: All views use security_invoker = true to respect RLS policies

-- VIEW: Combined dashboard data for resume analysis
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

-- VIEW: User statistics aggregation
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

-- VIEW: Masked profiles for GDPR compliance and reporting
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

-- VIEW: Detailed skill analysis with job context
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

-- VIEW: Job match summary for quick overview
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

-- VIEW: Recent user activity feed
CREATE OR REPLACE VIEW public.recent_activity
WITH (security_invoker = true)
AS SELECT * FROM (
  SELECT 
    user_id,
    'resume_uploaded' as activity_type,
    file_name as activity_target,
    created_at as activity_time
  FROM public.resumes
  UNION ALL
  SELECT 
    user_id,
    'resume_adapted' as activity_type,
    file_name as activity_target,
    created_at as activity_time
  FROM public.rewritten_resumes
  UNION ALL
  SELECT 
    user_id,
    'job_added' as activity_type,
    title as activity_target,
    created_at as activity_time
  FROM public.job_postings
  UNION ALL
  SELECT 
    user_id,
    'cover_letter_created' as activity_type,
    NULL as activity_target,
    created_at as activity_time
  FROM public.cover_letters
) activity
ORDER BY activity_time DESC;
