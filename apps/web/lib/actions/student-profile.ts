"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// `savedAt` changes on every successful save so the UI reacts to each save (not
// just the first — a boolean effect dependency only fires once).
export type ProfileState = { error?: string; savedAt?: number };

// Update a student's core profile fields. RLS-scoped: only the student's assigned
// counsellor (or admin) can update — a bug here can't bypass the DB policy.
export async function updateStudentProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) return { error: "Missing student." };

  const preferred = String(formData.get("preferred_countries") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase
    .from("student_profiles")
    .update({
      intended_major: String(formData.get("intended_major") ?? "").trim() || null,
      career_interest: String(formData.get("career_interest") ?? "").trim() || null,
      preferred_countries: preferred,
    })
    .eq("user_id", studentId);

  if (error) return { error: error.message };

  revalidatePath(`/counsellor/students/${studentId}`);
  return { savedAt: Date.now() };
}
