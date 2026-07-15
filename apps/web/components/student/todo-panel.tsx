"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ClipboardList, ListTodo } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, StatusPill, cn } from "@epicenter/ui";
import { FormResponseDialog } from "@/components/student/form-response-dialog";
import { formatDue, isOverdue } from "@/lib/format-due";
import type { Question } from "@/lib/actions/forms";

type TaskItem = {
  kind: "task";
  id: string;
  title: string;
  due: string | null;
};
type FormItem = {
  kind: "form";
  id: string;
  title: string;
  source: string;
  questions: Question[] | null;
  external_form_id: string | null;
  status: string;
};
type Item = TaskItem | FormItem;
export type MeetingItem = { id: string; title: string; startsAt: string };

function formatMeetingWhen(startsAt: string): string {
  const start = new Date(startsAt);
  const now = new Date();
  const diffDays = Math.round(
    (new Date(start).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000,
  );
  // Explicit locale — server and client can otherwise resolve `undefined` to
  // different default locales/hour-cycles and produce a hydration mismatch.
  const time = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays <= 0) return `Today at ${time}`;
  if (diffDays === 1) return `Tomorrow at ${time}`;
  return `${start.toLocaleDateString("en-US", { weekday: "long" })} at ${time}`;
}

// SU8: forms sit alongside ordinary tasks in one To Do list, not a separate
// nav tab — the same "one place to check" pattern Documents already uses.
// If a counsellor meeting is coming up, it surfaces as its own card above the
// task/form list — a real calendar_events row, never fabricated.
export function TodoPanel({
  items,
  meeting = null,
}: {
  items: Item[];
  meeting?: MeetingItem | null;
}) {
  const [openForm, setOpenForm] = useState<FormItem | null>(null);
  const empty = items.length === 0 && !meeting;
  // SU1 Screen 10's s-todo-panel shows a handful of task cards + "View all" —
  // an unbounded list would defeat the "one calm screen" point of the panel.
  // Forms have no other entry point in the student shell (SU8 — no separate
  // nav tab), so they're never the ones capped, only tasks (which "View all"
  // resolves to the full Roadmap).
  const VISIBLE_TASKS = 3;
  const formItems = items.filter((i): i is FormItem => i.kind === "form");
  // Soonest-due (and overdue) first — the panel's job is surfacing what's
  // most urgent within the visible slots, not whatever order the query returned.
  const taskItems = items
    .filter((i): i is TaskItem => i.kind === "task")
    .sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due).getTime() - new Date(b.due).getTime();
    });
  const visibleTasks = taskItems.slice(0, VISIBLE_TASKS);
  const overflowTaskCount = taskItems.length - visibleTasks.length;
  const visibleItems: Item[] = [...visibleTasks, ...formItems];

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both bg-glass shadow-glass backdrop-blur-glass duration-300 ease-out motion-reduce:animate-none">
      <CardHeader>
        <CardTitle>To Do</CardTitle>
        <CardDescription>Tasks and forms that need your attention.</CardDescription>
      </CardHeader>

      {empty ? (
        <p className="px-1 py-6 text-center text-sm text-ink-secondary">
          Nothing yet. Check back after your first meeting with your counsellor.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {meeting ? (
            <li>
              <Link
                href="/student/calendar"
                className="flex items-center gap-3 rounded-md border border-yellow/50 bg-yellow/10 px-3 py-3 transition-colors hover:-translate-y-0.5 hover:bg-yellow/15 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
              >
                <CalendarClock className="size-5 shrink-0 text-ink" aria-hidden />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink">
                    Upcoming meeting
                  </p>
                  <p className="text-sm font-semibold text-ink">{meeting.title}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-ink-secondary">
                  {formatMeetingWhen(meeting.startsAt)}
                </span>
              </Link>
            </li>
          ) : null}
          {visibleItems.map((item) =>
            item.kind === "task" ? (
              <li
                key={`task-${item.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2",
                  isOverdue(item.due)
                    ? "border-overdue-border bg-overdue-bg"
                    : "border-border-soft bg-surface-raised",
                )}
              >
                <ListTodo
                  className={cn(
                    "size-4 shrink-0",
                    isOverdue(item.due) ? "text-overdue-ink" : "text-ink-tertiary",
                  )}
                  aria-hidden
                />
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      isOverdue(item.due) ? "text-overdue-ink" : "text-ink-tertiary",
                    )}
                  >
                    Task
                  </p>
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                </div>
                {isOverdue(item.due) ? (
                  <StatusPill status="overdue" label={formatDue(item.due)} className="shrink-0" />
                ) : (
                  <span className="shrink-0 text-xs text-ink-secondary">
                    {formatDue(item.due)}
                  </span>
                )}
              </li>
            ) : (
              <li key={`form-${item.id}`}>
                <button
                  type="button"
                  onClick={() => setOpenForm(item)}
                  className="flex w-full items-center gap-3 rounded-md border border-border-soft bg-surface-raised px-3 py-2 text-left transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
                >
                  <ClipboardList className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                      Form
                    </p>
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-pill px-2 py-0.5 text-xs font-semibold",
                      item.status === "responded"
                        ? "bg-complete-bg text-complete-ink"
                        : "bg-surface-muted text-ink-secondary",
                    )}
                  >
                    {item.status === "responded" ? "Complete" : "New"}
                  </span>
                </button>
              </li>
            ),
          )}
          {overflowTaskCount > 0 ? (
            <li>
              <Link
                href="/student/roadmap"
                className="block px-1 py-1 text-center text-xs font-semibold text-ink-secondary hover:text-ink hover:underline"
              >
                View all ({overflowTaskCount} more)
              </Link>
            </li>
          ) : null}
        </ul>
      )}

      {openForm ? (
        <FormResponseDialog
          form={openForm}
          open={Boolean(openForm)}
          onOpenChange={(open) => {
            if (!open) setOpenForm(null);
          }}
        />
      ) : null}
    </Card>
  );
}
