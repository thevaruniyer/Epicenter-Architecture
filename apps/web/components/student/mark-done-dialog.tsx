"use client";

import { useActionState, useEffect, useState } from "react";
import {
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
import { markTaskDone, type MarkDoneState } from "@/lib/actions/student-roadmap";

const initial: MarkDoneState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-yellow";

export function MarkDoneDialog({
  taskId,
  taskTitle,
}: {
  taskId: string;
  taskTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(markTaskDone, initial);

  useEffect(() => {
    if (state.savedAt) setOpen(false);
  }, [state.savedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Mark done</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark done</DialogTitle>
          <DialogDescription>
            &ldquo;{taskTitle}&rdquo; — your counsellor confirms it after review.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="taskId" value={taskId} />

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Evidence{" "}
            <span className="font-normal text-ink-tertiary">
              (optional — image or PDF)
            </span>
            <input
              name="evidence"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="text-sm text-ink file:mr-3 file:rounded-md file:border file:border-border-strong file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Comment{" "}
            <span className="font-normal text-ink-tertiary">(optional)</span>
            <textarea
              name="comment"
              rows={3}
              placeholder="Anything your counsellor should know…"
              className={fieldClass}
            />
          </label>

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
              {pending ? "Submitting…" : "Submit for review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
