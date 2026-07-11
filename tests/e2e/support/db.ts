import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// RLS-scoped Supabase clients for E2E fixture setup — acting AS seeded users
// (so tests exercise the real RLS boundary, not a privileged backdoor).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const CREDS = {
  counsellor: {
    email: "rls-counsellor1@epicenter-test.dev",
    password: "Test-Passw0rd!",
  },
  // Kabir Singh — a student on counsellor1's caseload.
  student: {
    email: "demo-student1@epicenter-test.dev",
    password: "Test-Passw0rd!",
  },
};
export const STUDENT_ID = "60000000-0000-0000-0000-000000000001";

export async function clientFor(
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const client = createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}
