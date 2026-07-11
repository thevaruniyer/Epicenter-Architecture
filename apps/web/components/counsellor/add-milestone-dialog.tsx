"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@epicenter/ui";
import { createMilestone, type RoadmapState } from "@/lib/actions/roadmap";

const initial: RoadmapState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

export function AddMilestoneDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createMilestone, initial);

  useEffect(() => {
    if (state.savedAt) setOpen(false);
  }, [state.savedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="sm">
          + Add milestone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add milestone</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="studentId" value={studentId} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Title
            <input
              name="title"
              placeholder="e.g. Summer research & test prep"
              className={fieldClass}
              required
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
              {pending ? "Adding…" : "Add milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
