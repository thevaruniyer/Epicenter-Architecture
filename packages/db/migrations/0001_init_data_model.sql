-- Epicenter Education — full data model (architecture §2).
--
-- Conventions (referential actions are not specified in §2; these are chosen for
-- pilot sanity): the owning-student / owner FK cascades on delete; nullable
-- actor/counsellor references SET NULL; required non-student references cascade.
-- RLS is ENABLED on every public table here (deny-by-default). The actual access
-- policies are added in the next migration (Prompt 1.4) — until then only the
-- service role can read/write these tables.

-- ============================================================
-- Core identity & profile
-- ============================================================

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  entra_id text unique,
  email text not null,
  full_name text,
  role text not null default 'student'
    check (role in ('admin', 'head_of_counselling', 'counsellor', 'student')),
  created_at timestamptz not null default now()
);
comment on table public.users is
  'Profile/role data everything else joins against; the credential is owned by auth.users.';

-- Populate public.users when an auth user is created. Role comes from signup
-- metadata during the pilot (Stage 1); real accounts are admin-created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.student_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  grade smallint check (grade in (11, 12)),
  subjects jsonb not null default '[]'::jsonb,
  age smallint,
  intended_major text,
  hobbies jsonb not null default '[]'::jsonb,               -- array of tags
  extracurriculars jsonb not null default '[]'::jsonb,      -- array of {activity, role, duration}
  preferred_countries jsonb not null default '[]'::jsonb,
  career_interest text,
  test_scores jsonb not null default '{}'::jsonb,
  assigned_counsellor_id uuid references public.users (id) on delete set null,
  onboarding_completed_at timestamptz,                      -- null = skipped/incomplete
  onboarding_current_step integer not null default 0
);

create table public.counsellor_caseloads (
  id uuid primary key default gen_random_uuid(),
  counsellor_id uuid not null references public.users (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  reassigned_from uuid references public.users (id) on delete set null,
  unique (counsellor_id, student_id)
);

-- ============================================================
-- Notes
-- ============================================================

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  author_id uuid references public.users (id) on delete set null,
  visibility text not null check (visibility in ('shared', 'private')),
  type text not null check (type in ('meeting', 'student_update')),
  raw_text text,          -- retained even after clean-up; never shown, queryable for audit
  final_text text,
  ai_cleaned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Roadmap & tasks
-- ============================================================

create table public.roadmap_milestones (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  template_source text
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid references public.roadmap_milestones (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  category text not null default 'other'
    check (category in ('academic', 'ec', 'essay', 'testing', 'documents_admin', 'other')),
  assignee text not null default 'student'
    check (assignee in ('student', 'counsellor')),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'pending_review', 'complete')),
  due_date date,
  evidence_url text,
  evidence_comment text,
  confirmed_by uuid references public.users (id) on delete set null,
  confirmed_at timestamptz
);

-- ============================================================
-- Shortlist & applications
-- ============================================================

create table public.shortlist_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  university_name text not null,
  course text,
  country text,
  deadline date,
  category text check (category in ('reach', 'target', 'safety')),  -- null until a counsellor sets it
  status text not null default 'awaiting_review'
    check (status in ('awaiting_review', 'suggested', 'approved')),
  suggested_by text not null check (suggested_by in ('student', 'counsellor'))
);

create table public.student_priorities (
  student_id uuid primary key references public.users (id) on delete cascade,
  top_priority text,
  location_pref text,
  financial_aid_needed boolean not null default false,
  culture_pref text
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  shortlist_entry_id uuid references public.shortlist_entries (id) on delete set null,
  student_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'preparing'
    check (status in ('preparing', 'submitted', 'interview_requested', 'offer_received', 'rejected')),
  decision text check (decision in ('accepted', 'declined')),
  offer_conditions text,
  deposit_deadline date
);

create table public.application_requirements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  title text not null,
  requirement_type text not null default 'other'
    check (requirement_type in ('essay', 'transcript', 'recommendation', 'form', 'other')),
  status text not null default 'awaiting_student'
    check (status in ('awaiting_student', 'submitted_awaiting_confirmation', 'needs_revision', 'complete')),
  ai_extracted boolean not null default false,
  submitted_at timestamptz,
  confirmed_by uuid references public.users (id) on delete set null,
  confirmed_at timestamptz
);

-- ============================================================
-- Documents (contextual; metadata lives on the thing they support)
-- ============================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  storage_path text not null,
  linked_task_id uuid references public.tasks (id) on delete set null,
  linked_requirement_id uuid references public.application_requirements (id) on delete set null,
  uploaded_at timestamptz not null default now()
);

-- ============================================================
-- Meetings & calendar
-- ============================================================

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.users (id) on delete cascade,
  counsellor_id uuid references public.users (id) on delete set null,
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  google_synced boolean not null default false,
  google_event_id text
);

create table public.google_calendar_connections (
  user_id uuid primary key references public.users (id) on delete cascade,
  access_token text,        -- encrypted at the app layer
  refresh_token text,       -- encrypted at the app layer
  show_google_in_epicenter boolean not null default false,   -- sync toggle (UC9)
  push_epicenter_to_google boolean not null default false     -- sync toggle (UC9)
);

-- ============================================================
-- Forms
-- ============================================================

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users (id) on delete cascade,
  title text not null,
  source text not null default 'native'
    check (source in ('native', 'microsoft_forms', 'google_forms')),
  external_form_id text,
  questions jsonb not null default '[]'::jsonb
);

create table public.form_assignments (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'sent' check (status in ('sent', 'responded')),
  unique (form_id, student_id)
);

create table public.form_responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- AI infrastructure
-- ============================================================

create table public.student_signals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  category text,
  tag_text text,
  source_note_id uuid references public.notes (id) on delete set null,
  extracted_at timestamptz not null default now()
);

create table public.risk_flags (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in ('grade_drop', 'pace_lag')),
  trigger_snapshot jsonb not null default '{}'::jsonb,   -- checkpoints/dates that caused it
  dismissed_at timestamptz,
  dismissed_by uuid references public.users (id) on delete set null
);

create table public.stalled_task_alerts (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  flagged_at timestamptz not null default now(),
  dismissed_at timestamptz,
  dismissed_by uuid references public.users (id) on delete set null
);

create table public.reassignment_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  generated_for_counsellor_id uuid not null references public.users (id) on delete cascade,
  content text not null,        -- AI-generated handoff summary; permanent
  generated_at timestamptz not null default now()
);

create table public.ai_action_log (
  id uuid primary key default gen_random_uuid(),
  feature text not null check (feature in (
    'clean_up', 'nudge', 'digest', 'risk_flag', 'reassignment_snapshot',
    'stalled_alert', 'essay_feedback', 'checklist_extraction', 'meeting_prep',
    'onboarding_extraction'
  )),
  student_id uuid references public.users (id) on delete set null,
  actor_id uuid references public.users (id) on delete set null,
  input_ref text,
  output_text text,
  reviewed_by uuid references public.users (id) on delete set null,
  edited_before_save boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Foreign-key indexes (perf + satisfies the unindexed-FK advisor)
-- ============================================================

create index on public.student_profiles (assigned_counsellor_id);
create index on public.counsellor_caseloads (counsellor_id);
create index on public.counsellor_caseloads (student_id);
create index on public.notes (student_id);
create index on public.notes (author_id);
create index on public.roadmap_milestones (student_id);
create index on public.tasks (milestone_id);
create index on public.tasks (student_id);
create index on public.tasks (confirmed_by);
create index on public.shortlist_entries (student_id);
create index on public.applications (shortlist_entry_id);
create index on public.applications (student_id);
create index on public.application_requirements (application_id);
create index on public.application_requirements (confirmed_by);
create index on public.documents (owner_id);
create index on public.documents (linked_task_id);
create index on public.documents (linked_requirement_id);
create index on public.calendar_events (student_id);
create index on public.calendar_events (counsellor_id);
create index on public.forms (created_by);
create index on public.form_assignments (form_id);
create index on public.form_assignments (student_id);
create index on public.form_responses (form_id);
create index on public.form_responses (student_id);
create index on public.student_signals (student_id);
create index on public.student_signals (source_note_id);
create index on public.risk_flags (student_id);
create index on public.stalled_task_alerts (task_id);
create index on public.reassignment_snapshots (student_id);
create index on public.reassignment_snapshots (generated_for_counsellor_id);
create index on public.ai_action_log (student_id);
create index on public.ai_action_log (actor_id);

-- ============================================================
-- Enable RLS (deny-by-default) on every public table. Policies: Prompt 1.4.
-- ============================================================

alter table public.users enable row level security;
alter table public.student_profiles enable row level security;
alter table public.counsellor_caseloads enable row level security;
alter table public.notes enable row level security;
alter table public.roadmap_milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.shortlist_entries enable row level security;
alter table public.student_priorities enable row level security;
alter table public.applications enable row level security;
alter table public.application_requirements enable row level security;
alter table public.documents enable row level security;
alter table public.calendar_events enable row level security;
alter table public.google_calendar_connections enable row level security;
alter table public.forms enable row level security;
alter table public.form_assignments enable row level security;
alter table public.form_responses enable row level security;
alter table public.student_signals enable row level security;
alter table public.risk_flags enable row level security;
alter table public.stalled_task_alerts enable row level security;
alter table public.reassignment_snapshots enable row level security;
alter table public.ai_action_log enable row level security;
