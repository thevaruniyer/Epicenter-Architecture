"use client";

import { useState } from "react";
import { ClipboardList, ListTodo } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, cn } from "@epicenter/ui";
import { FormResponseDialog } from "@/components/student/form-response-dialog";
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

// SU8: forms sit alongside ordinary tasks in one To Do list, not a separate
// nav tab — the same "one place to check" pattern Documents already uses.
export function TodoPanel({ items }: { items: Item[] }) {
  const [openForm, setOpenForm] = useState<FormItem | null>(null);
  const pending = items.filter((i) => i.kind === "task" || i.status !== "responded");

  return (
    <Card>
      <CardHeader>
        <CardTitle>To Do</CardTitle>
        <CardDescription>Tasks and forms that need your attention.</CardDescription>
      </CardHeader>
      {pending.length === 0 ? (
        <p className="px-1 text-sm text-ink-tertiary">All caught up.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pending.map((item) =>
            item.kind === "task" ? (
              <li
                key={`task-${item.id}`}
                className="flex items-center gap-3 rounded-md border border-border-soft bg-surface-raised px-3 py-2"
              >
                <ListTodo className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                    Task
                  </p>
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                </div>
                <span className="shrink-0 text-xs text-ink-secondary">
                  {item.due ? `Due ${item.due}` : ""}
                </span>
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
