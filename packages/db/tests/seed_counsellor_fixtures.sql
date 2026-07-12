-- Stage-2 demo/test fixtures: give counsellor1 (from seed_rls_fixtures.sql) a
-- small caseload of students with full profiles, so the Students grid and the
-- Overview/Profile tab have real (seeded) data. Idempotent for the added rows.
-- Applied to the dev project via the Supabase MCP. Depends on seed_rls_fixtures.sql
-- (counsellor 3333..., student 1111...). Passwords: 'Test-Passw0rd!'.

-- Name the existing fixtures so the grid/greeting show real names.
update public.users set full_name = 'Rohan Mehta'  where id = '33333333-3333-3333-3333-333333333333';
update public.users set full_name = 'Priya Sharma' where id = '55555555-5555-5555-5555-555555555555';
update public.users set full_name = 'Aisha Khan'   where id = '11111111-1111-1111-1111-111111111111';

update public.student_profiles set
  intended_major = 'Economics', subjects = '["Economics HL","Mathematics HL","History SL","English SL"]'::jsonb,
  hobbies = '["Debate","Model UN"]'::jsonb,
  extracurriculars = '[{"activity":"Debate Team","role":"Captain","duration":"3 yrs"}]'::jsonb,
  preferred_countries = '["United States","United Kingdom"]'::jsonb,
  career_interest = 'Policy / economics research',
  test_scores = '{"SAT":1480,"TOEFL":112}'::jsonb,
  onboarding_completed_at = now()
where user_id = '11111111-1111-1111-1111-111111111111';

-- Three more students on counsellor1's caseload.
delete from auth.users where email like 'demo-student%@epicenter-test.dev';

do $$
declare r record;
begin
  for r in
    select * from (values
      ('60000000-0000-0000-0000-000000000001'::uuid, 'demo-student1@epicenter-test.dev', 'Kabir Singh'),
      ('60000000-0000-0000-0000-000000000002'::uuid, 'demo-student2@epicenter-test.dev', 'Ananya Kapoor'),
      ('60000000-0000-0000-0000-000000000003'::uuid, 'demo-student3@epicenter-test.dev', 'Meera Iyer')
    ) as t(id, email, full_name)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated',
      r.email, extensions.crypt('Test-Passw0rd!', extensions.gen_salt('bf')), now(),
      now(), now(), '{"provider":"email","providers":["email"]}',
      jsonb_build_object('role', 'student', 'full_name', r.full_name), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (extensions.gen_random_uuid(), r.id, r.id::text,
      jsonb_build_object('sub', r.id::text, 'email', r.email, 'email_verified', true),
      'email', now(), now(), now());
  end loop;
end $$;

insert into public.student_profiles
  (user_id, grade, subjects, age, intended_major, hobbies, extracurriculars,
   preferred_countries, career_interest, test_scores, onboarding_completed_at)
values
  ('60000000-0000-0000-0000-000000000001', 11,
   '["Computer Science HL","Mathematics HL","Physics SL","English SL"]'::jsonb, 16,
   'Computer Science', '["Robotics","Chess"]'::jsonb,
   '[{"activity":"Robotics Club","role":"Team Lead","duration":"2 yrs"},{"activity":"Math Olympiad","role":"Regional Qualifier","duration":"1 yr"}]'::jsonb,
   '["United Kingdom","Canada"]'::jsonb, 'Software engineering / entrepreneurship',
   '{"PSAT":1350}'::jsonb, now()),
  ('60000000-0000-0000-0000-000000000002', 12,
   '["Biology HL","Chemistry HL","Mathematics SL","English SL"]'::jsonb, 17,
   'Biomedical Sciences', '["Volunteering","Painting"]'::jsonb,
   '[{"activity":"Hospital Volunteering","role":"Volunteer","duration":"2 yrs"}]'::jsonb,
   '["United States","Canada"]'::jsonb, 'Medicine',
   '{"SAT":1520}'::jsonb, now()),
  ('60000000-0000-0000-0000-000000000003', 12,
   '["Art HL","English HL","History SL","Mathematics SL"]'::jsonb, 17,
   'Architecture', '["Sketching","Photography"]'::jsonb,
   '[{"activity":"Art Club","role":"President","duration":"2 yrs"}]'::jsonb,
   '["United Kingdom","Italy"]'::jsonb, 'Architecture',
   '{"SAT":1400}'::jsonb, now());

insert into public.counsellor_caseloads (counsellor_id, student_id) values
  ('33333333-3333-3333-3333-333333333333', '60000000-0000-0000-0000-000000000001'),
  ('33333333-3333-3333-3333-333333333333', '60000000-0000-0000-0000-000000000002'),
  ('33333333-3333-3333-3333-333333333333', '60000000-0000-0000-0000-000000000003');

-- assigned_counsellor_id is the RLS source of truth (counsels_student() reads it,
-- not counsellor_caseloads). Keep both consistent.
update public.student_profiles set assigned_counsellor_id = '33333333-3333-3333-3333-333333333333'
where user_id in (
  '60000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000003'
);
