-- Stage-8 demo/test fixtures: give demo-student1 (Kabir Singh, from
-- seed_counsellor_fixtures.sql) a few real documents so the new Documents tab
-- (Prompt 8.2) has real, chronologically-ordered, downloadable content instead
-- of rendering permanently empty. Depends on seed_counsellor_fixtures.sql and
-- migration 0009_storage_documents.sql (the `documents` storage bucket).
--
-- Unlike the other seed_*.sql files here, the storage OBJECTS themselves
-- (actual file bytes) can't be created by SQL alone — Supabase Storage objects
-- are written through the Storage API, not a row insert. They were uploaded by
-- a one-off script signed in as demo-student1, respecting the same
-- documents_insert_own RLS policy a real upload would use. This file seeds the
-- matching public.documents metadata rows; re-run the upload step separately
-- if reseeding from scratch (see Stage 8 audit notes for the three sample
-- files: Grade11_Transcript.pdf, Passport_Photo.png,
-- Personal_Statement_Draft_v1.txt, all under the storage path
-- 60000000-0000-0000-0000-000000000001/<filename>).

delete from public.documents where owner_id = '60000000-0000-0000-0000-000000000001';

insert into public.documents (owner_id, storage_path, uploaded_at) values
  ('60000000-0000-0000-0000-000000000001',
   '60000000-0000-0000-0000-000000000001/Grade11_Transcript.pdf',
   '2026-06-02T10:00:00Z'),
  ('60000000-0000-0000-0000-000000000001',
   '60000000-0000-0000-0000-000000000001/Passport_Photo.png',
   '2026-06-18T14:30:00Z'),
  ('60000000-0000-0000-0000-000000000001',
   '60000000-0000-0000-0000-000000000001/Personal_Statement_Draft_v1.txt',
   '2026-07-10T09:15:00Z');
