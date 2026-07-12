"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AiBadge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@epicenter/ui";
import { createTask, type RoadmapState } from "@/lib/actions/roadmap";

const initial: RoadmapState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "academic", label: "Academic" },
  { value: "ec", label: "Extracurriculars & Achievements" },
  { value: "essay", label: "Essays & Applications" },
  { value: "testing", label: "Testing" },
  { value: "documents_admin", label: "Documents & Admin" },
  { value: "other", label: "Other" },
];

export function AddTaskDialog({
  studentId,
  milestones,
  signalsByCategory = {},
}: {
  studentId: string;
  milestones: { id: string; title: string }[];
  // AI-extracted signals grouped by task category (Flow Plan §4.3). A pure
  // table read done server-side — no live LLM call when this panel opens.
  signalsByCategory?: Record<string, string[]>;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [state, formAction, pending] = useActionState(createTask, initial);

  useEffect(() => {
    if (state.savedAt) {
      setOpen(false);
      setCategory("");
    }
  }, [state.savedAt]);

  const nudges = category ? (signalsByCategory[category] ?? []) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <DialogDescription>
            The student marks it done; you confirm it to complete.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="studentId" value={studentId} />

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Category
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClass}
            >
              <option value="">Choose a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          {/* Category-aware nudge: only renders when this category actually has
              signals — an empty state, never a fabricated one (Flow Plan §4.3). */}
          {nudges.length > 0 ? (
            <div className="flex flex-col gap-1.5 rounded-md border border-border-soft bg-surface-muted px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                <AiBadge /> From recent notes
              </span>
              <ul className="flex flex-wrap gap-1.5">
                {nudges.map((tag, i) => (
                  <li
                    key={i}
                    className="rounded-pill border border-border-strong bg-surface-raised px-2.5 py-1 text-xs text-ink-secondary"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Title
            <input
              name="title"
              placeholder="e.g. Research three target universities"
              className={fieldClass}
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Due date
              <input type="date" name="due_date" className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Milestone
              <select name="milestone_id" defaultValue="" className={fieldClass}>
                <option value="">No milestone</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-error-ink">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="tertiary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
