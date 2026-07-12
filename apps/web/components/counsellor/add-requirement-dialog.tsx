"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@epicenter/ui";
import { addRequirement, type ActionState } from "@/lib/actions/applications";

const initial: ActionState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

const TYPES = [
  { value: "essay", label: "Essay / Personal statement" },
  { value: "transcript", label: "Transcript" },
  { value: "recommendation", label: "Recommendation letter" },
  { value: "form", label: "Form" },
  { value: "other", label: "Other" },
];

// UC5: requirements are added manually here (AI checklist extraction is Phase 5).
export function AddRequirementDialog({
  applicationId,
  studentId,
}: {
  applicationId: string;
  studentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addRequirement, initial);

  useEffect(() => {
    if (state.savedAt) setOpen(false);
  }, [state.savedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="sm">
          + Add requirement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add requirement</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="studentId" value={studentId} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Title
            <input
              name="title"
              placeholder="e.g. Personal statement (UCAS, 4000 char)"
              className={fieldClass}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Type
            <select name="requirement_type" className={fieldClass} defaultValue="essay">
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
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
              {pending ? "Adding…" : "Add requirement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
