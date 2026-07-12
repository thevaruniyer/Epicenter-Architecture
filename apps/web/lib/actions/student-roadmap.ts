"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canTransition, TASK_MODEL, type TaskStatus } from "@/lib/tick-then-confirm";

export type MarkDoneState = { error?: string; savedAt?: number };

// Student "marks a task done" — the TICK half of tick-then-confirm. Moves the
// task to pending_review (RLS forbids the student setting complete), optionally
// with an uploaded evidence file + comment. Uses the shared status machine.
export async function markTaskDone(
  _prev: MarkDoneState,
  formData: FormData,
): Promise<MarkDoneState> {
  const taskId = String(formData.get("taskId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const file = formData.get("evidence");
  if (!taskId) return { error: "Missing task." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: task } = await supabase
    .from("tasks")
    .select("status, student_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task || task.student_id !== user.id) return { error: "Task not found." };

  const status = task.status as TaskStatus;
  const canTick =
    canTransition(TASK_MODEL, status, "pending_review", "student") ||
    status === "pending_review"; // allow re-upload while awaiting review
  if (!canTick) return { error: "This task can't be submitted right now." };

  const patch: Record<string, unknown> = { status: "pending_review" };

  if (file instanceof File && file.size > 0) {
    const ext = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : "bin";
    const path = `${user.id}/${taskId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("evidence")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return { error: `Upload failed: ${upErr.message}` };
    patch.evidence_url = path;
  }
  if (comment) patch.evidence_comment = comment;

  const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/student/roadmap");
  return { savedAt: Date.now() };
}
