import { createClient } from "@/lib/supabase/server";
import { isUserRole, type UserRole } from "@/lib/roles";

// Re-export the pure role constants/types for server-side convenience.
export {
  USER_ROLES,
  ROLE_LABELS,
  isUserRole,
  type UserRole,
} from "@/lib/roles";

export type SessionUser = {
  id: string;
  email: string | null;
  role: UserRole;
};

/**
 * Resolve the current session user and their role for route guards.
 *
 * Stage 1 (this prompt): role is read from Supabase Auth user metadata set at
 * signup. Once the `users` table + RLS land (Prompts 1.3–1.4), role becomes the
 * authoritative `users.role` column (admin-assigned) — this helper is the single
 * place that will change. Returns null when there is no authenticated user.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const metaRole = user.user_metadata?.role;
  const role: UserRole = isUserRole(metaRole) ? metaRole : "student";

  return { id: user.id, email: user.email ?? null, role };
}
