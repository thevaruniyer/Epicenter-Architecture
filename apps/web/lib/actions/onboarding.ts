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

export async function saveOnboardingStep(formData: FormData): Promise<void> {
  const step = Number(formData.get("step") ?? 0);
  const patch: Record<string, unknown> = {};

  switch (step) {
    case 0: {
      const age = Number(formData.get("age"));
      if (Number.isFinite(age) && age > 0) patch.age = age;
      break;
    }
    case 1: {
      const grade = Number(formData.get("grade"));
      if (grade === 11 || grade === 12) patch.grade = grade;
      break;
    }
    case 2:
      patch.subjects = splitList(String(formData.get("subjects") ?? ""));
      break;
    case 3:
      patch.hobbies = splitList(String(formData.get("hobbies") ?? ""));
      break;
    case 4:
      patch.intended_major =
        String(formData.get("intended_major") ?? "").trim() || null;
      break;
    case 5:
      // Plain form: store each line as a minimal object; AI structures it in Phase 5.
      patch.extracurriculars = splitList(
        String(formData.get("extracurriculars") ?? ""),
      ).map((activity) => ({ activity }));
      break;
  }

  const isLast = step >= TOTAL_STEPS - 1;
  patch.onboarding_current_step = isLast ? TOTAL_STEPS : step + 1;
  if (isLast) patch.onboarding_completed_at = new Date().toISOString();

  const error = await patchProfile(patch);
  revalidatePath("/onboarding");
  if (error) redirect("/onboarding"); // save failed — stay on the step
  redirect(isLast ? "/student/home" : "/onboarding");
}

export async function onboardingBack(formData: FormData): Promise<void> {
  const step = Number(formData.get("step") ?? 0);
  await patchProfile({ onboarding_current_step: Math.max(step - 1, 0) });
  revalidatePath("/onboarding");
  redirect("/onboarding");
}

export async function skipOnboarding(): Promise<void> {
  // Leave current step + no completed_at → resumable from Home later.
  redirect("/student/home");
}
