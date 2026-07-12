"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ShortlistCategory } from "@/lib/status-display";

export type ActionState = { error?: string; savedAt?: number };

const CATEGORIES: ShortlistCategory[] = ["reach", "target", "safety"];

// --- Student: suggest a university (SU4) ------------------------------------
// The student can only SUGGEST — RLS forces suggested_by='student',
// status='awaiting_review', category=null. The counsellor categorises later.
export async function suggestUniversity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const university = String(formData.get("university") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const note = String(formData.get("student_note") ?? "").trim();
  if (!university) return { error: "University name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("shortlist_entries").insert({
    student_id: user.id,
    university_name: university,
    course: course || null,
    student_note: note || null,
    suggested_by: "student",
    status: "awaiting_review",
    category: null,
  });
  if (error) return { error: error.message };

  revalidatePath("/student/shortlist");
  return { savedAt: Date.now() };
}

// --- Student or counsellor: save "what I want out of my list" priorities -----
export async function savePriorities(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // studentId defaults to the caller (student saving their own); a counsellor
  // passes the target student explicitly. RLS authorises either way.
  const studentId = String(formData.get("studentId") ?? "") || user.id;

  const { error } = await supabase.from("student_priorities").upsert(
    {
      student_id: studentId,
      top_priority: String(formData.get("top_priority") ?? "").trim() || null,
      location_pref: String(formData.get("location_pref") ?? "").trim() || null,
      financial_aid_needed: formData.get("financial_aid_needed") === "on",
      culture_pref: String(formData.get("culture_pref") ?? "").trim() || null,
    },
    { onConflict: "student_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/student/shortlist");
  if (studentId !== user.id)
    revalidatePath(`/counsellor/students/${studentId}/shortlist`);
  return { savedAt: Date.now() };
}

// --- Counsellor: add a university to the shortlist (UC4) ----------------------
export async function addUniversity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const studentId = String(formData.get("studentId") ?? "");
  const university = String(formData.get("university") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim();
  if (!studentId || !university)
    return { error: "Student and university are required." };

  const supabase = await createClient();
  const { error } = await supabase.from("shortlist_entries").insert({
    student_id: studentId,
    university_name: university,
    course: course || null,
    country: country || null,
    deadline: deadline || null,
    suggested_by: "counsellor",
    status: "suggested",
    category: null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/counsellor/students/${studentId}/shortlist`);
  return { savedAt: Date.now() };
}

// --- Counsellor: review — set category + approve (UC4) -----------------------
export async function reviewShortlistEntry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const entryId = String(formData.get("entryId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const category = String(formData.get("category") ?? "") as ShortlistCategory;
  if (!entryId || !CATEGORIES.includes(category))
    return { error: "Pick reach, target, or safety." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("shortlist_entries")
    .update({ category, status: "approved" })
    .eq("id", entryId);
  if (error) return { error: error.message };

  revalidatePath(`/counsellor/students/${studentId}/shortlist`);
  return { savedAt: Date.now() };
}

// --- Counsellor: remove an entry --------------------------------------------
export async function deleteShortlistEntry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const entryId = String(formData.get("entryId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!entryId) return { error: "Missing entry." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("shortlist_entries")
    .delete()
    .eq("id", entryId);
  if (error) return { error: error.message };

  revalidatePath(`/counsellor/students/${studentId}/shortlist`);
  return { savedAt: Date.now() };
}
