-- Stage-3 onboarding fixture: a student with an admin-created profile that has
-- NOT completed onboarding (grade prefilled, onboarding_completed_at null). Used
-- to exercise the onboarding wizard + the completion/skip E2E. Applied via the
-- Supabase MCP. Password: 'Test-Passw0rd!'. Assigned to counsellor1.

delete from auth.users where email = 'onboarding-test@epicenter-test.dev';

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '70000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
  'onboarding-test@epicenter-test.dev',
  extensions.crypt('Test-Passw0rd!', extensions.gen_salt('bf')), now(),
  now(), now(), '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role', 'student', 'full_name', 'Nikhil Rao'), '', '', '', ''
);
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  extensions.gen_random_uuid(), '70000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', '70000000-0000-0000-0000-000000000001', 'email', 'onboarding-test@epicenter-test.dev', 'email_verified', true),
  'email', now(), now(), now()
);

-- Admin-created profile: grade + subjects prefilled, onboarding not complete.
insert into public.student_profiles
  (user_id, grade, subjects, assigned_counsellor_id, onboarding_current_step, onboarding_completed_at)
values (
  '70000000-0000-0000-0000-000000000001', 11,
  '["Computer Science HL","Mathematics HL","Physics SL","English SL"]'::jsonb,
  '33333333-3333-3333-3333-333333333333', 0, null
);
