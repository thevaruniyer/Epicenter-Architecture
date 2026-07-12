-- Support for Stalled-Task Alerts (AI_Integrations_Spec §1.8).
--
-- The stalled detection needs to know HOW LONG a task has sat in pending_review
-- (the "3 business days in Pending Review" threshold). The tasks table had no
-- timestamp for that transition, so add one: set whenever a task enters
-- pending_review (a student submits / re-submits). Nullable — only meaningful
-- while status = 'pending_review'.
alter table public.tasks
  add column if not exists pending_review_at timestamptz;

-- The alert stores its grounded, Gemini-phrased sentence so display is a plain
-- read, not a repeated model call (mirrors risk_flags.trigger_snapshot.summary).
alter table public.stalled_task_alerts
  add column if not exists summary text;
