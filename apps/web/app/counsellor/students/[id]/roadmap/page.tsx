import { after } from "next/server";
import { Card } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import { confirmTask } from "@/lib/actions/roadmap";
import {
  runStalledDetection,
  getActiveStalledAlerts,
} from "@/lib/stalled-tasks";
import { StalledAlertsPanel } from "@/components/counsellor/stalled-alerts-panel";
import { AddMilestoneDialog } from "@/components/counsellor/add-milestone-dialog";
import { AddTaskDialog } from "@/components/counsellor/add-task-dialog";
import { TaskStatusBadge } from "@/components/counsellor/task-status-badge";
import type { TaskStatus } from "@/lib/tick-then-confirm";

type Milestone = { id: string; title: string };
type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  milestone_id: string | null;
};

function formatDue(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function StudentRoadmapTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Passive stalled-task detection runs after the response; active alerts read
  // now. The client is built here (not inside the callback) — after() runs
  // once the response is already sent, and createClient() needs cookies(),
  // which Next.js doesn't allow reading from inside an after() callback.
  after(() => runStalledDetection(supabase, id));
  const stalledAlerts = await getActiveStalledAlerts(id);

  const [{ data: milestoneRows }, { data: taskRows }, { data: signalRows }] =
    await Promise.all([
      supabase
        .from("roadmap_milestones")
        .select("id, title")
        .eq("student_id", id)
        .order("title"),
      supabase
        .from("tasks")
        .select("id, title, status, due_date, milestone_id")
        .eq("student_id", id)
        .order("due_date", { nullsFirst: false }),
      // AI-extracted signals for the category-aware nudge (Flow Plan §4.3):
      // a plain table read, grouped by category client-side below.
      supabase
        .from("student_signals")
        .select("category, tag_text")
        .eq("student_id", id)
        .order("extracted_at", { ascending: false }),
    ]);

  const milestones = (milestoneRows as Milestone[]) ?? [];
  const tasks = (taskRows as Task[]) ?? [];

  const signalsByCategory: Record<string, string[]> = {};
  for (const s of (signalRows as { category: string | null; tag_text: string | null }[]) ??
    []) {
    if (!s.category || !s.tag_text) continue;
    (signalsByCategory[s.category] ??= []).push(s.tag_text);
  }
  const tasksByMilestone = (mid: string | null) =>
    tasks.filter((t) => t.milestone_id === mid);

  const groups: { key: string; title: string; tasks: Task[] }[] = [
    ...milestones.map((m) => ({
      key: m.id,
      title: m.title,
      tasks: tasksByMilestone(m.id),
    })),
  ];
  const looseTasks = tasksByMilestone(null);
  if (looseTasks.length) {
    groups.push({ key: "none", title: "Other tasks", tasks: looseTasks });
  }

  return (
    <div className="flex flex-col gap-4">
      <StalledAlertsPanel alerts={stalledAlerts} studentId={id} />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <AddMilestoneDialog studentId={id} />
        <AddTaskDialog
          studentId={id}
          milestones={milestones}
          signalsByCategory={signalsByCategory}
        />
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-ink-tertiary">
          No roadmap yet. Add a milestone or a task to get started.
        </p>
      ) : (
        groups.map((g) => {
          const total = g.tasks.length;
          const done = g.tasks.filter((t) => t.status === "complete").length;
          const pct = total ? Math.round((done / total) * 100) : 0;

          return (
            <Card key={g.key}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold text-ink">{g.title}</h2>
                <span className="text-xs text-ink-tertiary">
                  {done}/{total} complete
                </span>
              </div>
              {g.key !== "none" ? (
                <div className="mb-4 h-2 overflow-hidden rounded-pill bg-surface-muted">
                  <div
                    className="h-full rounded-pill bg-yellow"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ) : null}

              {g.tasks.length === 0 ? (
                <p className="text-sm text-ink-tertiary">No tasks yet.</p>
              ) : (
                <ul className="divide-y divide-border-soft">
                  {g.tasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{t.title}</p>
                        {formatDue(t.due_date) ? (
                          <p className="text-xs text-ink-tertiary">
                            Due {formatDue(t.due_date)}
                          </p>
                        ) : null}
                      </div>
                      <TaskStatusBadge status={t.status} />
                      {t.status === "pending_review" ? (
                        <form action={confirmTask}>
                          <input type="hidden" name="taskId" value={t.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-yellow px-3 py-1.5 text-sm font-bold text-ink transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
                          >
                            Confirm
                          </button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
