-- Harden the RLS helper + signup-trigger functions.
--
-- These SECURITY DEFINER functions exist to be used INSIDE RLS policies, not to
-- be called directly. By default Postgres grants EXECUTE to PUBLIC, which exposes
-- them as PostgREST RPCs (/rest/v1/rpc/<fn>) to logged-out (anon) callers too.
-- Strip that blanket grant. RLS policy evaluation runs as the querying role, so
-- `authenticated` still needs EXECUTE on the helpers used in policies; anon does
-- not. handle_new_user is invoked only by the auth.users trigger (as its owner),
-- so it is not re-granted to anyone.

revoke execute on function
  public.my_role(),
  public.is_admin(),
  public.is_head(),
  public.is_counsellor(),
  public.counsels_student(uuid),
  public.counsels_task(uuid),
  public.owns_application(uuid),
  public.counsels_application(uuid),
  public.can_access_application(uuid),
  public.created_form(uuid),
  public.assigned_form(uuid),
  public.handle_new_user()
from public, anon;

grant execute on function
  public.my_role(),
  public.is_admin(),
  public.is_head(),
  public.is_counsellor(),
  public.counsels_student(uuid),
  public.counsels_task(uuid),
  public.owns_application(uuid),
  public.counsels_application(uuid),
  public.can_access_application(uuid),
  public.created_form(uuid),
  public.assigned_form(uuid)
to authenticated, service_role;

-- handle_new_user is invoked only by the auth.users trigger (as its owner). No
-- client role needs EXECUTE, but Supabase's default privileges grant it to
-- `authenticated` on creation — revoke that so it isn't a callable RPC at all.
revoke execute on function public.handle_new_user() from authenticated;

-- NOTE: the 11 RLS helper functions above intentionally keep EXECUTE for
-- `authenticated` — RLS policy evaluation runs as the querying role, so the
-- policies could not call them otherwise. They therefore remain callable as
-- RPCs by signed-in users (Supabase advisor lint 0029, WARN). This is low-risk:
-- each returns only a boolean/text about the *caller's own* role or relationships
-- (never another user's data). To remove even that surface, relocate the helpers
-- to a non-PostgREST-exposed schema (e.g. `private`) — deferred as optional hardening.
