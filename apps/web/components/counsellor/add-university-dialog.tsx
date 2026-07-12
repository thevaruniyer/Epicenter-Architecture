"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@epicenter/ui";
import { addUniversity, type ActionState } from "@/lib/actions/shortlist";

const initial: ActionState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

// UC4 Screen 3: the counsellor adds a university directly (either side can add).
export function AddUniversityDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addUniversity, initial);

  useEffect(() => {
    if (state.savedAt) setOpen(false);
  }, [state.savedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="sm">
          + Add University
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add University</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="studentId" value={studentId} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            University
            <input
              name="university"
              placeholder="e.g. Cornell University"
              className={fieldClass}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Course
            <input
              name="course"
              placeholder="e.g. Applied Economics & Management"
              className={fieldClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Country
              <input name="country" placeholder="e.g. USA" className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Deadline
              <input type="date" name="deadline" className={fieldClass} />
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
              {pending ? "Adding…" : "Add to Shortlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
