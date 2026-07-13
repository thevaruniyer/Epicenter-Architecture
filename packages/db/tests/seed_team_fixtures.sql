-- Stage-6 (Team & Reassignment) fixture: name counsellor2 (from
-- seed_rls_fixtures.sql) so the Team view shows a real name instead of a blank
-- row. Head of Counselling (rls-head, "Priya Sharma") is already named via
-- seed_counsellor_fixtures.sql. Applied to the dev project via the Supabase MCP.
update public.users set full_name = 'Simran Kaur' where id = '44444444-4444-4444-4444-444444444444';
