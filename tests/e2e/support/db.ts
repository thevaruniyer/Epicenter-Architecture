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

// Dedicated onboarding fixture student (admin-created profile, not onboarded).
export const ONBOARDING_STUDENT = {
  email: "onboarding-test@epicenter-test.dev",
  password: "Test-Passw0rd!",
};
export const ONBOARDING_STUDENT_ID = "70000000-0000-0000-0000-000000000001";

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

// Reset the onboarding fixture student to its un-onboarded state (acting as the
// student — RLS lets them update their own profile). Keeps admin-set grade/subjects.
export async function resetOnboardingStudent(): Promise<void> {
  const client = await clientFor(
    ONBOARDING_STUDENT.email,
    ONBOARDING_STUDENT.password,
  );
  const { error } = await client
    .from("student_profiles")
    .update({
      onboarding_completed_at: null,
      onboarding_current_step: 0,
      age: null,
      hobbies: [],
      intended_major: null,
      extracurriculars: [],
    })
    .eq("user_id", ONBOARDING_STUDENT_ID);
  if (error) throw new Error(`reset onboarding failed: ${error.message}`);
}
