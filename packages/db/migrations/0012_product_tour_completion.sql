-- Stage 9 Prompt 9.10: persist first-time product tour completion in the
-- database (not localStorage) so it reliably never re-shows across devices
-- or sessions. Students already have a self-update path on student_profiles
-- (sp_update); non-student roles have no self-update path on users at all
-- (users_update_admin is admin-only, correctly, since it also guards role and
-- email) — so this adds a narrow self-service policy plus a trigger that
-- restricts the self path to touching product_tour_completed_at only.

alter table public.student_profiles
  add column product_tour_completed_at timestamptz;

alter table public.users
  add column product_tour_completed_at timestamptz;

create policy users_update_self_tour on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.enforce_self_tour_update_only()
returns trigger
language plpgsql
security definer set search_path = '' as $$
begin
  -- The admin path (users_update_admin) may change anything; this guard only
  -- constrains the self-service path added above.
  if public.is_admin() then
    return new;
  end if;
  if new.id <> old.id
     or new.email <> old.email
     or new.role <> old.role
     or new.full_name is distinct from old.full_name
     or new.entra_id is distinct from old.entra_id
     or new.created_at <> old.created_at then
    raise exception 'self-service update may only change product_tour_completed_at';
  end if;
  return new;
end;
$$;

create trigger users_self_tour_update_guard
  before update on public.users
  for each row execute function public.enforce_self_tour_update_only();
