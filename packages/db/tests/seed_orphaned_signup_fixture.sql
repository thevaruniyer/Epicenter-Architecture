-- Stage-9 Prompt 9.2 fixture: simulates the exact real-world bug this prompt
-- fixes — a confirmed student auth user with NO student_profiles row at all
-- (this project currently has email confirmation enabled, so a real
-- self-signup student only ever becomes an authenticated request later, via
-- signIn(), after confirming by email — this fixture starts at exactly that
-- point). Deliberately does NOT insert into public.student_profiles.
-- Applied to the dev project via the Supabase MCP. Password: 'Test-Passw0rd!'.

delete from auth.users where email = 'orphaned-signup-test@epicenter-test.dev';

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '80000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
  'orphaned-signup-test@epicenter-test.dev',
  extensions.crypt('Test-Passw0rd!', extensions.gen_salt('bf')), now(),
  now(), now(), '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role', 'student', 'full_name', 'Orphaned Signup Test'), '', '', '', ''
);
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  extensions.gen_random_uuid(), '80000000-0000-0000-0000-000000000001',
  '80000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', '80000000-0000-0000-0000-000000000001', 'email', 'orphaned-signup-test@epicenter-test.dev', 'email_verified', true),
  'email', now(), now(), now()
);

-- No student_profiles insert here — that's the point of this fixture.
