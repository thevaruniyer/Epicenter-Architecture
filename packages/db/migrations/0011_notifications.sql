-- Stage 9 Prompt 9.7: notifications table backing the floating panel (Prompt
-- 9.8) and its Bell icon on both shells. Inserts happen server-side through
-- application code at exactly three event points (reassignment, meeting
-- creation, task assignment) — never directly by end users.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  cta_label text,
  cta_href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.notifications (user_id);
create index on public.notifications (user_id, read_at);

alter table public.notifications enable row level security;

-- A user only ever sees/marks-read their own notifications (the sensitive
-- boundary). Insert is scoped to the same relationship the app's other
-- system-write tables use (ail_insert on ai_action_log is the precedent):
-- the inserter must have a legitimate relationship to the recipient, not an
-- open write to any user_id.
create policy notif_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notif_insert on public.notifications for insert to authenticated
  with check (user_id = auth.uid() or public.counsels_student(user_id) or public.is_head());
create policy notif_update on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
