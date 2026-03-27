-- Adds audio attachment columns for LMS enhancements.
alter table if exists public.assignments
  add column if not exists audio_url text null;

alter table if exists public.questions
  add column if not exists audio_url text null;

alter table if exists public.submissions
  add column if not exists audio_answer_url text null;

-- Recommended: keep materials/submissions buckets private and serve signed URLs only.
-- Full screenshot prevention is NOT 100% possible in browsers.
