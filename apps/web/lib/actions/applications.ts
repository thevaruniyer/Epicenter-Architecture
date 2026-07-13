"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { extractRequirementChecklist, logAiAction } from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";
import {
  canTransition,
  REQUIREMENT_MODEL,
  type RequirementStatus,
} from "@/lib/tick-then-confirm";
import {
  canAdvanceApplication,
  canRecordDecision,
} from "@/lib/application-status";
import type { ApplicationStatus, Decision } from "@/lib/status-display";

export type ActionState = { error?: string; savedAt?: number };

const REQUIREMENT_TYPES = [
  "essay",
  "transcript",
  "recommendation",
  "form",
  "other",
];

function revalidateBoth(studentId: string) {
  revalidatePath(`/counsellor/students/${studentId}/applications`);
  revalidatePath("/counsellor/applications");
  revalidatePath("/student/application");
}

// --- Counsellor: convert an approved shortlist entry into a live application --
// Two-click flow (UC5): the application pulls its identity from the shortlist
// entry, so nothing is re-typed. Guards against double-converting.
export async function convertToApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const entryId = String(formData.get("entryId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!entryId || !studentId) return { error: "Missing shortlist entry." };

  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("shortlist_entries")
    .select("id, student_id, status")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry) return { error: "Shortlist entry not found." };
  if (entry.status !== "approved")
    return { error: "Only an approved entry can be converted." };

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("shortlist_entry_id", entryId)
    .maybeSingle();
  if (existing) return { error: "This entry is already an application." };

  const { error } = await supabase.from("applications").insert({
    shortlist_entry_id: entryId,
    student_id: entry.student_id,
    status: "preparing",
  });
  if (error) return { error: error.message };

  revalidateBoth(studentId);
  revalidatePath(`/counsellor/students/${studentId}/shortlist`);
  return { savedAt: Date.now() };
}

// --- Counsellor: add a requirement manually (AI extraction is Phase 5) -------
export async function addRequirement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("requirement_type") ?? "other");
  if (!applicationId || !title) return { error: "Requirement title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("application_requirements").insert({
    application_id: applicationId,
    title,
    requirement_type: REQUIREMENT_TYPES.includes(type) ? type : "other",
    status: "awaiting_student",
  });
  if (error) return { error: error.message };

  revalidateBoth(studentId);
  return { savedAt: Date.now() };
}

// --- Student: submit a requirement — the TICK half of tick-then-confirm ------
export async function submitRequirement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const requirementId = String(formData.get("requirementId") ?? "");
  if (!requirementId) return { error: "Missing requirement." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: req } = await supabase
    .from("application_requirements")
    .select("status")
    .eq("id", requirementId)
    .maybeSingle();
  if (!req) return { error: "Requirement not found." };

  const from = req.status as RequirementStatus;
  if (
    !canTransition(
      REQUIREMENT_MODEL,
      from,
      "submitted_awaiting_confirmation",
      "student",
    )
  )
    return { error: "This requirement can't be submitted right now." };

  const { error } = await supabase
    .from("application_requirements")
    .update({
      status: "submitted_awaiting_confirmation",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", requirementId);
  if (error) return { error: error.message };

  revalidatePath("/student/application");
  return { savedAt: Date.now() };
}

// --- Counsellor: confirm or send back a requirement — the CONFIRM half -------
export async function reviewRequirement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const requirementId = String(formData.get("requirementId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const decision = String(formData.get("decision") ?? ""); // "complete" | "needs_revision"
  const to = decision as RequirementStatus;
  if (!requirementId) return { error: "Missing requirement." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: req } = await supabase
    .from("application_requirements")
    .select("status")
    .eq("id", requirementId)
    .maybeSingle();
  if (!req) return { error: "Requirement not found." };

  const from = req.status as RequirementStatus;
  if (!canTransition(REQUIREMENT_MODEL, from, to, "counsellor"))
    return { error: `Can't move this requirement to ${decision}.` };

  const patch: Record<string, unknown> = { status: to };
  if (to === "complete") {
    patch.confirmed_by = user.id;
    patch.confirmed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("application_requirements")
    .update(patch)
    .eq("id", requirementId);
  if (error) return { error: error.message };

  revalidateBoth(studentId);
  return { savedAt: Date.now() };
}

// --- Counsellor: advance the application's outcome status (ordered) ----------
export async function advanceApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const to = String(formData.get("to") ?? "") as ApplicationStatus;
  if (!applicationId) return { error: "Missing application." };

  const supabase = await createClient();
  const { data: app } = await supabase
    .from("applications")
    .select("status")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) return { error: "Application not found." };

  const from = app.status as ApplicationStatus;
  if (!canAdvanceApplication(from, to))
    return { error: `Can't move application from ${from} to ${to}.` };

  const patch: Record<string, unknown> = { status: to };
  if (to === "offer_received") {
    const conditions = String(formData.get("offer_conditions") ?? "").trim();
    const deposit = String(formData.get("deposit_deadline") ?? "").trim();
    if (conditions) patch.offer_conditions = conditions;
    if (deposit) patch.deposit_deadline = deposit;
  }

  const { error } = await supabase
    .from("applications")
    .update(patch)
    .eq("id", applicationId);
  if (error) return { error: error.message };

  revalidateBoth(studentId);
  return { savedAt: Date.now() };
}

// --- Student: record accept/decline on a received offer ----------------------
export async function recordDecision(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "") as Decision;
  if (!applicationId) return { error: "Missing application." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: app } = await supabase
    .from("applications")
    .select("status, decision, student_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app || app.student_id !== user.id)
    return { error: "Application not found." };

  if (
    !canRecordDecision(
      app.status as ApplicationStatus,
      (app.decision as Decision | null) ?? null,
      decision,
    )
  )
    return { error: "You can only record a decision on a received offer." };

  const { error } = await supabase
    .from("applications")
    .update({ decision })
    .eq("id", applicationId);
  if (error) return { error: error.message };

  revalidatePath("/student/application");
  return { savedAt: Date.now() };
}

// --- Counsellor: Requirement Checklist Extraction (§1.10, draft-then-approve) --
export type ChecklistState = {
  error?: string;
  items?: { title: string; type: string }[];
  at?: number;
};

// Extract an editable checklist from pasted text — nothing is saved here.
export async function extractChecklist(
  _prev: ChecklistState,
  formData: FormData,
): Promise<ChecklistState> {
  const text = String(formData.get("text") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "");
  if (text.length < 20) return { error: "Paste the requirements text first." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let items;
  try {
    items = await extractRequirementChecklist(text);
  } catch (err) {
    Sentry.captureException(err, { tags: { ai_feature: "checklist_extraction" } });
    return { error: "AI extraction is unavailable right now." };
  }
  if (!items.length) {
    return {
      error: "Couldn't find any requirements in that text — add them manually.",
    };
  }

  try {
    await logAiAction(supabase, {
      feature: "checklist_extraction",
      studentId: studentId || null,
      actorId: user?.id ?? null,
      outputText: JSON.stringify(items),
    });
  } catch (err) {
    // non-fatal — but a silently broken audit trail (CLAUDE.md §4) still
    // needs to be visible somewhere.
    Sentry.captureException(err, { tags: { ai_feature: "checklist_extraction_log" } });
  }

  return { items, at: Date.now() };
}

// Save the (edited) extracted checklist as real requirements. ai_extracted=true
// so the permanent AI badge marks these as AI-extracted (per §1.10).
export async function saveExtractedRequirements(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!applicationId) return { error: "Missing application." };

  let items: { title?: unknown; type?: unknown }[];
  try {
    const parsed = JSON.parse(String(formData.get("items") ?? "[]"));
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    return { error: "Invalid checklist." };
  }

  const rows = items
    .filter((i) => typeof i.title === "string" && (i.title as string).trim())
    .map((i) => ({
      application_id: applicationId,
      title: String(i.title).slice(0, 200),
      requirement_type: REQUIREMENT_TYPES.includes(String(i.type))
        ? String(i.type)
        : "other",
      status: "awaiting_student",
      ai_extracted: true,
    }));
  if (!rows.length) return { error: "Nothing to save." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("application_requirements")
    .insert(rows);
  if (error) return { error: error.message };

  revalidateBoth(studentId);
  return { savedAt: Date.now() };
}
