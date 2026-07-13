-- Stage 6 (Team & Reassignment): reassigning a student means flipping
-- student_profiles.assigned_counsellor_id, which is what counsels_student()
-- reads for every other table's RLS. sp_update never granted is_head() write
-- access, so a Head of Counselling could not actually perform a reassignment
-- under RLS even though counsellor_caseloads already fully permits them
-- (cc_insert/cc_update/cc_delete all check is_head()). Add the missing clause.
drop policy if exists sp_update on public.student_profiles;
create policy sp_update on public.student_profiles for update to authenticated
  using (user_id = auth.uid() or public.counsels_student(user_id) or public.is_head() or public.is_admin())
  with check (user_id = auth.uid() or public.counsels_student(user_id) or public.is_head() or public.is_admin());
