-- Onboarding Tag Extraction (§2.3) was missing a permanent post-save marker,
-- flagged in the Stage 5 drafts-vs-passive audit (Prompt 5.13): CLAUDE.md §4
-- requires the AI badge to stay once AI-touched content is saved, but
-- student_profiles had no record of whether hobbies/major/ECs came from the
-- AI-suggested-tags path. Once true, never reset to false — the badge is
-- permanent regardless of later plain-text edits, matching every other
-- draft-then-approve feature.
alter table public.student_profiles
  add column if not exists hobbies_ai_extracted boolean not null default false,
  add column if not exists intended_major_ai_extracted boolean not null default false,
  add column if not exists extracurriculars_ai_extracted boolean not null default false;
