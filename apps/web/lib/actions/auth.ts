"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isUserRole } from "@/lib/roles";

export type AuthState = { error?: string; message?: string };

// Root cause of the onboarding-skip bug (Stage 9 Prompt 9.2): a student's
// student_profiles row never got created, so app/page.tsx's
// `if (profile && ...)` check silently fell through to Home instead of
// onboarding. Called from signUp() for the immediate-session case (email
// confirmation disabled) AND from signIn() as a catch-all — this dev/test
// Supabase project currently has email confirmation ENABLED, so signUp()
// returns no session and a real student only ever gets an authenticated
// request later, via signIn(), after confirming by email. `onConflict`
// makes this a no-op for every student who already has a row (i.e. every
// sign-in after the first). assigned_counsellor_id is deliberately left
// unset — auto-assigning a default counsellor is a product decision, not
// something this fix should guess at.
async function ensureStudentProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("student_profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) return { error: error.message };
  return {};
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  const role = data.user?.user_metadata?.role;
  if (role === "student" && data.user) {
    const { error: profileError } = await ensureStudentProfile(supabase, data.user.id);
    if (profileError) {
      return { error: `Signed in, but profile setup failed: ${profileError}` };
    }
  }

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  // Role is self-selected here only as pilot test scaffolding; real accounts are
  // admin-created (architecture §3). Route guards read this back off the session.
  if (!isUserRole(role)) {
    return { error: "Please choose a valid role." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });
  if (error) {
    return { error: error.message };
  }

  // If email confirmation is disabled, a session is returned and the user is in.
  // If it's enabled, session is null until they confirm via email.
  if (!data.session) {
    return {
      message:
        "Account created. Check your email to confirm, then log in. (For the pilot, email confirmation can be disabled in Supabase Auth settings.)",
    };
  }

  if (role === "student" && data.user) {
    const { error: profileError } = await ensureStudentProfile(supabase, data.user.id);
    if (profileError) {
      return { error: `Account created, but profile setup failed: ${profileError}` };
    }
  }

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
