"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canTransition, TASK_MODEL, type TaskStatus } from "@/lib/tick-then-confirm";
import { createNotification } from "@/lib/notifications";

export type RoadmapState = { error?: string; savedAt?: number };

function revalidateRoadmap(studentId: string) {
  revalidatePath(`/counsellor/students/${studentId}/roadmap`);
}

export async function createMilestone(
  _prev: RoadmapState,
  formData: FormData,
): Promise<RoadmapState> {
  const studentId = String(formData.get("studentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!studentId) return { error: "Missing student." };
  if (!title) return { error: "Give the milestone a title." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("roadmap_milestones")
    .insert({ student_id: studentId, title });
  if (error) return { error: error.message };

  revalidateRoadmap(studentId);
  return { savedAt: Date.now() };
}

export async function createTask(
  _prev: RoadmapState,
  formData: FormData,
): Promise<RoadmapState> {
  const studentId = String(formData.get("studentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const milestoneId = String(formData.get("milestone_id") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "other");
  const CATEGORIES = [
    "academic",
    "ec",
    "essay",
    "testing",
    "documents_admin",
    "other",
  ];
  const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : "other";
  if (!studentId) return { error: "Missing student." };
  if (!title) return { error: "Give the task a title." };

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      student_id: studentId,
      milestone_id: milestoneId || null,
      title,
      due_date: dueDate || null,
      category,
      assignee: "student",
      status: "not_started",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Notify the student (Stage 9 Prompt 9.7) — deep-links to the specific task
  // via the #task-{id} anchor the roadmap page renders on each row, not just
  // the roadmap list.
  await createNotification(supabase, {
    userId: studentId,
    type: "task_assigned",
    title: `New task: ${title}`,
    ctaLabel: "Go to Task",
    ctaHref: `/student/roadmap#task-${task.id}`,
  });

  revalidateRoadmap(studentId);
  return { savedAt: Date.now() };
}

// Counsellor confirmation — the ONLY path a task reaches `complete`. Validated
// through the shared tick-then-confirm machine and the DB (RLS + the student
// policy that forbids students setting complete/confirmed_by).
export async function confirmTask(formData: FormData): Promise<void> {
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("status, student_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return;

  if (!canTransition(TASK_MODEL, task.status as TaskStatus, "complete", "counsellor")) {
    // Not awaiting confirmation — ignore (button only renders when it is).
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("tasks")
    .update({
      status: "complete",
      confirmed_by: user?.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  revalidateRoadmap(task.student_id as string);
}
