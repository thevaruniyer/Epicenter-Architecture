-- Supabase Storage bucket for roadmap-task evidence uploads (student work).
-- Private bucket; access via RLS on storage.objects. Path convention:
--   <student_user_id>/<task_id>/<filename>
-- so the first path segment identifies the owning student.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence', 'evidence', false, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- A student manages files under their own folder; the student's counsellor and
-- head of counselling can read them. Mirrors the roadmap/documents RLS boundary.

create policy "evidence_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidence_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'evidence'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.counsels_student(((storage.foldername(name))[1])::uuid)
      or public.is_head()
    )
  );

create policy "evidence_update_own" on storage.objects for update to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidence_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
