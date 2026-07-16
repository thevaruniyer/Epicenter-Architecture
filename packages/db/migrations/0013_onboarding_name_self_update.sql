-- Stage 10 Prompt 10.2: the new name onboarding step writes to users.full_name
-- directly (student_profiles has no name column), so the self-service guard
-- from migration 0012 (previously scoped to product_tour_completed_at only)
-- needs to also permit a student setting their own full_name. Still blocks
-- id/email/role/entra_id/created_at for the non-admin path.

create or replace function public.enforce_self_tour_update_only()
returns trigger
language plpgsql
security definer set search_path = '' as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.id <> old.id
     or new.email <> old.email
     or new.role <> old.role
     or new.entra_id is distinct from old.entra_id
     or new.created_at <> old.created_at then
    raise exception 'self-service update may only change full_name or product_tour_completed_at';
  end if;
  return new;
end;
$$;
