-- Stage 9 Prompt 9.2: fixes the student onboarding gate at its root cause —
-- signUp() never created a student_profiles row, so app/page.tsx's
-- onboarding-vs-home check silently fell through to Home for every
-- self-signup student. The missing piece wasn't app logic (that already
-- handles a real profile row correctly); it was that no RLS policy let a
-- newly-signed-up student insert their own row. The only existing insert
-- policy (sp_insert_admin) requires is_admin(), which a self-signup student
-- never is, and this codebase has no service-role/admin client to bypass RLS
-- with. This policy is the minimal, RLS-native fix: a user may insert a
-- student_profiles row only for themselves, mirroring the existing sp_update
-- policy's own `user_id = auth.uid()` self-scoping.

create policy sp_insert_self on public.student_profiles for insert to authenticated
  with check (user_id = auth.uid());
