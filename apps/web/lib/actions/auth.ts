"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUserRole } from "@/lib/roles";

export type AuthState = { error?: string; message?: string };

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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
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

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
