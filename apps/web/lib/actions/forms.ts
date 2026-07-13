"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; savedAt?: number; formId?: string };

export type FormSource = "native" | "microsoft_forms" | "google_forms";
export type QuestionType = "short_answer" | "multiple_choice" | "file_upload" | "date";
export type Question = {
  prompt: string;
  type: QuestionType;
  options?: string[]; // multiple_choice only
};

// UC10 Screen 2: native form builder. No external OAuth needed — questions are
// stored as jsonb and rendered/answered entirely inside the app.
export async function createNativeForm(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const questions = JSON.parse(String(formData.get("questions") ?? "[]")) as Question[];
  const studentIds = String(formData.get("studentIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title) return { error: "Give the form a title." };
  if (!questions.length) return { error: "Add at least one question." };
  if (!studentIds.length) return { error: "Choose who this form goes to." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: form, error } = await supabase
    .from("forms")
    .insert({ created_by: user.id, title, source: "native", questions })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const formId = form.id as string;
  const { error: assignError } = await supabase.from("form_assignments").insert(
    studentIds.map((studentId) => ({ form_id: formId, student_id: studentId, status: "sent" })),
  );
  if (assignError) return { error: assignError.message };

  revalidatePath("/counsellor/forms");
  return { savedAt: Date.now(), formId };
}

// UC10 "embed" paths: Microsoft Forms / Google Forms have no working OAuth
// integration in this codebase yet (Microsoft Forms rides on a Microsoft
// 365/Entra ID integration that doesn't exist — Phase 7 is a later milestone;
// Google Forms API creation needs the same OAuth credentials Calendar does,
// not yet configured). Rather than block on infrastructure that isn't there,
// the counsellor creates the form directly in Microsoft/Google Forms
// themselves and pastes the public share link here — it renders as an embed,
// exactly like the storyboard's "Microsoft Forms embed, styled to match the
// rest of the product" caption describes. Responses are collected by
// Microsoft/Google, not written back into form_responses (no API access to
// pull them) — the student instead confirms completion manually.
export async function createEmbedForm(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const source = String(formData.get("source") ?? "") as FormSource;
  const url = String(formData.get("url") ?? "").trim();
  const studentIds = String(formData.get("studentIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title) return { error: "Give the form a title." };
  if (source !== "microsoft_forms" && source !== "google_forms") {
    return { error: "Unknown form source." };
  }
  if (!/^https:\/\//.test(url)) return { error: "Paste the form's share link." };
  if (!studentIds.length) return { error: "Choose who this form goes to." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: form, error } = await supabase
    .from("forms")
    .insert({ created_by: user.id, title, source, external_form_id: url })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const formId = form.id as string;
  const { error: assignError } = await supabase.from("form_assignments").insert(
    studentIds.map((studentId) => ({ form_id: formId, student_id: studentId, status: "sent" })),
  );
  if (assignError) return { error: assignError.message };

  revalidatePath("/counsellor/forms");
  return { savedAt: Date.now(), formId };
}

// Student: fill out and submit a native form (SU8 Screen 2).
export async function submitFormResponse(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const formId = String(formData.get("formId") ?? "");
  const answers = JSON.parse(String(formData.get("answers") ?? "{}"));
  if (!formId) return { error: "Missing form." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("form_responses")
    .insert({ form_id: formId, student_id: user.id, answers });
  if (error) return { error: error.message };

  await supabase
    .from("form_assignments")
    .update({ status: "responded" })
    .eq("form_id", formId)
    .eq("student_id", user.id);

  revalidatePath("/student/home");
  return { savedAt: Date.now() };
}

// Student: acknowledge completion of an embedded external form — there's no
// API access to detect a real Microsoft/Google Forms submission, so the
// student explicitly confirms they submitted it (SU8 Screen 3's "Complete").
export async function acknowledgeEmbedForm(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const formId = String(formData.get("formId") ?? "");
  if (!formId) return { error: "Missing form." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("form_assignments")
    .update({ status: "responded" })
    .eq("form_id", formId)
    .eq("student_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/student/home");
  return { savedAt: Date.now() };
}
