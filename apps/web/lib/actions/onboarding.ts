"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { splitList, TOTAL_STEPS } from "@/lib/onboarding";

// Onboarding writes to the student's OWN student_profiles row (admin-created;
// RLS sp_update lets the student update their own). Skippable + resumable via
// onboarding_current_step; onboarding_completed_at is set only on finish.

async function patchProfile(
  patch: Record<string, unknown>,
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase
    .from("student_profiles")
    .update(patch)
    .eq("user_id", user.id);
  return error?.message ?? null;
}

// full_name lives on users, not student_profiles — the name step (only one
// that isn't a student_profiles field) needs its own update call alongside
// the normal onboarding_current_step bookkeeping every step does.
async function patchUserName(fullName: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase
    .from("users")
    .update({ full_name: fullName })
    .eq("id", user.id);
  return error?.message ?? null;
}

export async function saveOnboardingStep(formData: FormData): Promise<void> {
  const step = Number(formData.get("step") ?? 0);
  const patch: Record<string, unknown> = {};
  let nameError: string | null = null;

  switch (step) {
    case 0: {
      const fullName = String(formData.get("full_name") ?? "").trim();
      if (fullName) nameError = await patchUserName(fullName);
      break;
    }
    case 1: {
      const age = Number(formData.get("age"));
      if (Number.isFinite(age) && age > 0) patch.age = age;
      break;
    }
    case 2: {
      const grade = Number(formData.get("grade"));
      if (grade === 11 || grade === 12) patch.grade = grade;
      break;
    }
    case 3:
      patch.subjects = splitList(String(formData.get("subjects") ?? ""));
      break;
    case 4:
      patch.hobbies = splitList(String(formData.get("hobbies") ?? ""));
      break;
    case 5:
      patch.intended_major =
        String(formData.get("intended_major") ?? "").trim() || null;
      break;
    case 6:
      // Plain form: store each line as a minimal object.
      patch.extracurriculars = splitList(
        String(formData.get("extracurriculars") ?? ""),
      ).map((activity) => ({ activity }));
      break;
  }

  const isLast = step >= TOTAL_STEPS - 1;
  patch.onboarding_current_step = isLast ? TOTAL_STEPS : step + 1;
  if (isLast) patch.onboarding_completed_at = new Date().toISOString();

  const error = (await patchProfile(patch)) ?? nameError;
  revalidatePath("/onboarding");
  // A redirect back to the same route the form is already on is a redundant
  // extra navigation on top of what revalidatePath already triggers — every
  // step paid for two full round trips instead of one. Only redirect when
  // actually leaving the page (finishing onboarding).
  if (!error && isLast) redirect("/student/home");
}

export async function onboardingBack(formData: FormData): Promise<void> {
  const step = Number(formData.get("step") ?? 0);
  await patchProfile({ onboarding_current_step: Math.max(step - 1, 0) });
  revalidatePath("/onboarding");
}

export async function skipOnboarding(): Promise<void> {
  // Leave current step + no completed_at → resumable from Home later.
  redirect("/student/home");
}
