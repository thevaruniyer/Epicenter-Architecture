-- Epicenter Education — Row-Level Security policies (architecture §3).
--
-- The single highest-stakes part of the build. Enforced at the DB layer so a bug
-- in one API route can't leak data an RLS policy would have blocked. All policies
-- target the `authenticated` role, so anon (logged-out) requests get nothing.
-- The `service_role` bypasses RLS (BYPASSRLS) for background jobs / seeding.
--
-- Role/relationship checks go through SECURITY DEFINER helper functions so a
-- policy never re-triggers RLS on the table it is reading (avoids recursion).

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function public.my_role() returns text
  language sql stable security definer set search_path = '' as $$
  select u.role from public.users u where u.id = auth.uid();
$$;

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role() = 'admin', false);
$$;

create or replace function public.is_head() returns boolean
  language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role() = 'head_of_counselling', false);
$$;

create or replace function public.is_counsellor() returns boolean
  language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role() = 'counsellor', false);
$$;

-- Is the current user the assigned counsellor of `target` (a student user id)?
create or replace function public.counsels_student(target uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.student_profiles sp
    where sp.user_id = target and sp.assigned_counsellor_id = auth.uid()
  );
$$;

create or replace function public.counsels_task(target uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tasks t
    where t.id = target and (public.counsels_student(t.student_id) or public.is_head())
  );
$$;

create or replace function public.owns_application(target uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications a where a.id = target and a.student_id = auth.uid()
  );
$$;

create or replace function public.counsels_application(target uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications a
    where a.id = target and (public.counsels_student(a.student_id) or public.is_head())
  );
$$;

create or replace function public.can_access_application(target uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select public.owns_application(target) or public.counsels_application(target);
$$;

create or replace function public.created_form(target uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.forms f where f.id = target and f.created_by = auth.uid());
$$;

create or replace function public.assigned_form(target uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.form_assignments fa
    where fa.form_id = target and fa.student_id = auth.uid()
  );
$$;

-- ============================================================
-- users
-- ============================================================
create policy users_select on public.users for select to authenticated
  using (id = auth.uid() or public.counsels_student(id) or public.is_head() or public.is_admin());
create policy users_insert_admin on public.users for insert to authenticated
  with check (public.is_admin());
create policy users_update_admin on public.users for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- student_profiles
-- ============================================================
create policy sp_select on public.student_profiles for select to authenticated
  using (user_id = auth.uid() or public.counsels_student(user_id) or public.is_head() or public.is_admin());
create policy sp_insert_admin on public.student_profiles for insert to authenticated
  with check (public.is_admin());
create policy sp_update on public.student_profiles for update to authenticated
  using (user_id = auth.uid() or public.counsels_student(user_id) or public.is_admin())
  with check (user_id = auth.uid() or public.counsels_student(user_id) or public.is_admin());
create policy sp_delete_admin on public.student_profiles for delete to authenticated
  using (public.is_admin());

-- ============================================================
-- counsellor_caseloads
-- ============================================================
create policy cc_select on public.counsellor_caseloads for select to authenticated
  using (counsellor_id = auth.uid() or public.is_head() or public.is_admin());
create policy cc_insert on public.counsellor_caseloads for insert to authenticated
  with check (public.is_head() or public.is_admin());
create policy cc_update on public.counsellor_caseloads for update to authenticated
  using (public.is_head() or public.is_admin()) with check (public.is_head() or public.is_admin());
create policy cc_delete on public.counsellor_caseloads for delete to authenticated
  using (public.is_head() or public.is_admin());

-- ============================================================
-- notes  (private notes NEVER visible to students — the #1 boundary)
-- ============================================================
create policy notes_select on public.notes for select to authenticated
  using (
    (student_id = auth.uid() and visibility = 'shared')
    or public.counsels_student(student_id) or public.is_head()
  );
create policy notes_insert on public.notes for insert to authenticated
  with check (
    (student_id = auth.uid() and type = 'student_update' and visibility = 'shared')
    or public.counsels_student(student_id) or public.is_head()
  );
create policy notes_update on public.notes for update to authenticated
  using (public.counsels_student(student_id) or public.is_head())
  with check (public.counsels_student(student_id) or public.is_head());
create policy notes_delete on public.notes for delete to authenticated
  using (public.counsels_student(student_id) or public.is_head());

-- ============================================================
-- roadmap_milestones  (create rights stay with counsellor)
-- ============================================================
create policy rm_select on public.roadmap_milestones for select to authenticated
  using (student_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy rm_insert on public.roadmap_milestones for insert to authenticated
  with check (public.counsels_student(student_id) or public.is_head());
create policy rm_update on public.roadmap_milestones for update to authenticated
  using (public.counsels_student(student_id) or public.is_head())
  with check (public.counsels_student(student_id) or public.is_head());
create policy rm_delete on public.roadmap_milestones for delete to authenticated
  using (public.counsels_student(student_id) or public.is_head());

-- ============================================================
-- tasks  (tick-then-confirm: students can move status but NOT to complete,
--         and cannot set confirmed_by — only the counsellor confirms)
-- ============================================================
create policy tasks_select on public.tasks for select to authenticated
  using (student_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy tasks_insert on public.tasks for insert to authenticated
  with check (public.counsels_student(student_id) or public.is_head());
create policy tasks_update_counsellor on public.tasks for update to authenticated
  using (public.counsels_student(student_id) or public.is_head())
  with check (public.counsels_student(student_id) or public.is_head());
create policy tasks_update_student on public.tasks for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and status <> 'complete' and confirmed_by is null);
create policy tasks_delete on public.tasks for delete to authenticated
  using (public.counsels_student(student_id) or public.is_head());

-- ============================================================
-- shortlist_entries  (students may suggest; counsellor sets category/status)
-- ============================================================
create policy se_select on public.shortlist_entries for select to authenticated
  using (student_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy se_insert_student on public.shortlist_entries for insert to authenticated
  with check (
    student_id = auth.uid() and suggested_by = 'student'
    and status = 'awaiting_review' and category is null
  );
create policy se_insert_counsellor on public.shortlist_entries for insert to authenticated
  with check (public.counsels_student(student_id) or public.is_head());
create policy se_update on public.shortlist_entries for update to authenticated
  using (public.counsels_student(student_id) or public.is_head())
  with check (public.counsels_student(student_id) or public.is_head());
create policy se_delete on public.shortlist_entries for delete to authenticated
  using (public.counsels_student(student_id) or public.is_head());

-- ============================================================
-- student_priorities  (student + counsellor + head)
-- ============================================================
create policy pri_select on public.student_priorities for select to authenticated
  using (student_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy pri_insert on public.student_priorities for insert to authenticated
  with check (student_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy pri_update on public.student_priorities for update to authenticated
  using (student_id = auth.uid() or public.counsels_student(student_id) or public.is_head())
  with check (student_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy pri_delete on public.student_priorities for delete to authenticated
  using (public.counsels_student(student_id) or public.is_head());

-- ============================================================
-- applications  (counsellor creates; student may accept/decline own offer)
-- ============================================================
create policy app_select on public.applications for select to authenticated
  using (student_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy app_insert on public.applications for insert to authenticated
  with check (public.counsels_student(student_id) or public.is_head());
create policy app_update_counsellor on public.applications for update to authenticated
  using (public.counsels_student(student_id) or public.is_head())
  with check (public.counsels_student(student_id) or public.is_head());
create policy app_update_student on public.applications for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy app_delete on public.applications for delete to authenticated
  using (public.counsels_student(student_id) or public.is_head());

-- ============================================================
-- application_requirements  (student submits -> awaiting confirmation; counsellor confirms)
-- ============================================================
create policy req_select on public.application_requirements for select to authenticated
  using (public.can_access_application(application_id));
create policy req_insert on public.application_requirements for insert to authenticated
  with check (public.counsels_application(application_id));
create policy req_update_counsellor on public.application_requirements for update to authenticated
  using (public.counsels_application(application_id))
  with check (public.counsels_application(application_id));
create policy req_update_student on public.application_requirements for update to authenticated
  using (public.owns_application(application_id))
  with check (public.owns_application(application_id) and status <> 'complete' and confirmed_by is null);
create policy req_delete on public.application_requirements for delete to authenticated
  using (public.counsels_application(application_id));

-- ============================================================
-- documents
-- ============================================================
create policy doc_select on public.documents for select to authenticated
  using (owner_id = auth.uid() or public.counsels_student(owner_id) or public.is_head());
create policy doc_insert on public.documents for insert to authenticated
  with check (owner_id = auth.uid() or public.counsels_student(owner_id) or public.is_head());
create policy doc_update on public.documents for update to authenticated
  using (owner_id = auth.uid() or public.counsels_student(owner_id) or public.is_head())
  with check (owner_id = auth.uid() or public.counsels_student(owner_id) or public.is_head());
create policy doc_delete on public.documents for delete to authenticated
  using (owner_id = auth.uid() or public.counsels_student(owner_id) or public.is_head());

-- ============================================================
-- calendar_events
-- ============================================================
create policy cal_select on public.calendar_events for select to authenticated
  using (student_id = auth.uid() or counsellor_id = auth.uid()
         or public.counsels_student(student_id) or public.is_head());
create policy cal_insert on public.calendar_events for insert to authenticated
  with check (counsellor_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy cal_update on public.calendar_events for update to authenticated
  using (counsellor_id = auth.uid() or public.counsels_student(student_id) or public.is_head())
  with check (counsellor_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy cal_delete on public.calendar_events for delete to authenticated
  using (counsellor_id = auth.uid() or public.counsels_student(student_id) or public.is_head());

-- ============================================================
-- google_calendar_connections  (owner only — sensitive tokens)
-- ============================================================
create policy gcc_all on public.google_calendar_connections for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- forms  (counsellors create; assigned students can read)
-- ============================================================
create policy forms_select on public.forms for select to authenticated
  using (created_by = auth.uid() or public.assigned_form(id) or public.is_head());
create policy forms_insert on public.forms for insert to authenticated
  with check (created_by = auth.uid() and (public.is_counsellor() or public.is_head()));
create policy forms_update on public.forms for update to authenticated
  using (created_by = auth.uid() or public.is_head())
  with check (created_by = auth.uid() or public.is_head());
create policy forms_delete on public.forms for delete to authenticated
  using (created_by = auth.uid() or public.is_head());

-- ============================================================
-- form_assignments
-- ============================================================
create policy fa_select on public.form_assignments for select to authenticated
  using (student_id = auth.uid() or public.created_form(form_id) or public.is_head());
create policy fa_insert on public.form_assignments for insert to authenticated
  with check (public.created_form(form_id) or public.is_head());
create policy fa_update on public.form_assignments for update to authenticated
  using (student_id = auth.uid() or public.created_form(form_id) or public.is_head())
  with check (student_id = auth.uid() or public.created_form(form_id) or public.is_head());
create policy fa_delete on public.form_assignments for delete to authenticated
  using (public.created_form(form_id) or public.is_head());

-- ============================================================
-- form_responses  (student submits own; form creator + head read)
-- ============================================================
create policy fr_select on public.form_responses for select to authenticated
  using (student_id = auth.uid() or public.created_form(form_id) or public.is_head());
create policy fr_insert on public.form_responses for insert to authenticated
  with check (student_id = auth.uid());
create policy fr_update on public.form_responses for update to authenticated
  using (student_id = auth.uid() or public.created_form(form_id) or public.is_head())
  with check (student_id = auth.uid() or public.created_form(form_id) or public.is_head());
create policy fr_delete on public.form_responses for delete to authenticated
  using (public.created_form(form_id) or public.is_head());

-- ============================================================
-- student_signals  (counsellor-internal; NEVER students)
-- ============================================================
create policy sig_all on public.student_signals for all to authenticated
  using (public.counsels_student(student_id) or public.is_head())
  with check (public.counsels_student(student_id) or public.is_head());

-- ============================================================
-- risk_flags  (counsellor-internal, dismissible; NEVER students)
-- ============================================================
create policy risk_all on public.risk_flags for all to authenticated
  using (public.counsels_student(student_id) or public.is_head())
  with check (public.counsels_student(student_id) or public.is_head());

-- ============================================================
-- stalled_task_alerts  (counsellor-internal; NEVER students)
-- ============================================================
create policy stall_all on public.stalled_task_alerts for all to authenticated
  using (public.counsels_task(task_id)) with check (public.counsels_task(task_id));

-- ============================================================
-- reassignment_snapshots  (receiving counsellor + head; NEVER students)
-- ============================================================
create policy snap_select on public.reassignment_snapshots for select to authenticated
  using (generated_for_counsellor_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy snap_insert on public.reassignment_snapshots for insert to authenticated
  with check (public.is_head() or public.counsels_student(student_id));
create policy snap_update on public.reassignment_snapshots for update to authenticated
  using (public.is_head()) with check (public.is_head());
create policy snap_delete on public.reassignment_snapshots for delete to authenticated
  using (public.is_head());

-- ============================================================
-- ai_action_log  (audit; counsellor-internal; NEVER students)
-- ============================================================
create policy ail_select on public.ai_action_log for select to authenticated
  using (actor_id = auth.uid() or reviewed_by = auth.uid()
         or public.counsels_student(student_id) or public.is_head());
create policy ail_insert on public.ai_action_log for insert to authenticated
  with check (actor_id = auth.uid() or public.counsels_student(student_id) or public.is_head());
create policy ail_update on public.ai_action_log for update to authenticated
  using (reviewed_by = auth.uid() or public.is_head())
  with check (reviewed_by = auth.uid() or public.is_head());
create policy ail_delete on public.ai_action_log for delete to authenticated
  using (public.is_head());
