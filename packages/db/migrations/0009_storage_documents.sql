-- Supabase Storage bucket backing the public.documents table (Stage 8, Prompt
-- 8.2 — Documents tab). Private bucket; access via RLS on storage.objects.
-- Path convention: <owner_id>/<filename>, mirroring 0004_storage_evidence.sql,
-- so the first path segment identifies the owning student.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false, 20971520,
  array[
    'image/png', 'image/jpeg', 'image/webp', 'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do nothing;

-- A student manages files under their own folder; the student's counsellor and
-- head of counselling can read them. Mirrors the evidence bucket's boundary and
-- the doc_select/doc_insert RLS policies on public.documents itself.

create policy "documents_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.counsels_student(((storage.foldername(name))[1])::uuid)
      or public.is_head()
    )
  );

create policy "documents_update_own" on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
