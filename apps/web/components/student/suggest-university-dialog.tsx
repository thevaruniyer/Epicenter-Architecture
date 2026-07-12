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
import { suggestUniversity, type ActionState } from "@/lib/actions/shortlist";

const initial: ActionState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-yellow";

// SU4 Screen 2: the student SUGGESTS a university. Deliberately NO
// reach/target/safety selector — categorisation is the counsellor's call.
export function SuggestUniversityDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(suggestUniversity, initial);

  useEffect(() => {
    if (state.savedAt) setOpen(false);
  }, [state.savedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Suggest a University</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggest a University</DialogTitle>
          <DialogDescription>
            Your counsellor reviews it and decides where it fits.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
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
            Course{" "}
            <span className="font-normal text-ink-tertiary">(optional)</span>
            <input
              name="course"
              placeholder="e.g. Applied Economics & Management"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Why I&rsquo;m interested{" "}
            <span className="font-normal text-ink-tertiary">(optional)</span>
            <textarea
              name="student_note"
              rows={3}
              placeholder="What draws you to this one?"
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
              {pending ? "Sending…" : "Send to Counsellor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
