-- RLS integration-test fixtures. Idempotent: re-running replaces the fixtures.
-- Creates confirmed auth users (bypassing GoTrue email validation/confirmation)
-- of each role; the on_auth_user_created trigger populates public.users. Then
-- seeds two students on two different counsellors, plus a shared + private note
-- and a task on student1. Passwords: 'Test-Passw0rd!'.
--
-- Applied to the dev project via the Supabase MCP (service-role context). Not a
-- schema migration — this is seed data for tests/integration.

-- Clean up prior fixtures (cascades to public.users and all child rows).
delete from auth.users where email like 'rls-%@epicenter-test.dev';

do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('11111111-1111-1111-1111-111111111111'::uuid, 'rls-student1@epicenter-test.dev',    'student'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'rls-student2@epicenter-test.dev',    'student'),
      ('33333333-3333-3333-3333-333333333333'::uuid, 'rls-counsellor1@epicenter-test.dev', 'counsellor'),
      ('44444444-4444-4444-4444-444444444444'::uuid, 'rls-counsellor2@epicenter-test.dev', 'counsellor'),
      ('55555555-5555-5555-5555-555555555555'::uuid, 'rls-head@epicenter-test.dev',        'head_of_counselling')
    ) as t(id, email, role)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated',
      r.email, extensions.crypt('Test-Passw0rd!', extensions.gen_salt('bf')), now(),
      now(), now(), '{"provider":"email","providers":["email"]}',
      jsonb_build_object('role', r.role), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      extensions.gen_random_uuid(), r.id, r.id::text,
      jsonb_build_object('sub', r.id::text, 'email', r.email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end loop;
end $$;

-- Profiles: student1 -> counsellor1, student2 -> counsellor2.
insert into public.student_profiles (user_id, grade, assigned_counsellor_id) values
  ('11111111-1111-1111-1111-111111111111', 12, '33333333-3333-3333-3333-333333333333'),
  ('22222222-2222-2222-2222-222222222222', 11, '44444444-4444-4444-4444-444444444444');

-- Caseloads.
insert into public.counsellor_caseloads (counsellor_id, student_id) values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222');

-- Notes on student1: one shared, one private (both authored by counsellor1).
insert into public.notes (id, student_id, author_id, visibility, type, final_text) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333333', 'shared', 'meeting', 'Shared: discussed UK/Canada shortlist.'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333333', 'private', 'meeting', 'PRIVATE: parents pushing Imperial, manage gently.');

-- A milestone + task on student1.
insert into public.roadmap_milestones (id, student_id, title) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Summer research');
insert into public.tasks (id, milestone_id, student_id, title, status) values
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'Research majors', 'not_started');
