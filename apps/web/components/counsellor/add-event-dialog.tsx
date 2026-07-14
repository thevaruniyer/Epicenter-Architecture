"use client";

import { useActionState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@epicenter/ui";
import { createCalendarEvent, type ActionState } from "@/lib/actions/calendar";

const initial: ActionState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

export function AddEventDialog({
  open,
  onOpenChange,
  students,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCalendarEvent, initial);

  useEffect(() => {
    if (state.savedAt) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Title
            <input name="title" required className={fieldClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Starts
              <input type="datetime-local" name="startsAt" required className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Ends
              <input type="datetime-local" name="endsAt" required className={fieldClass} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Student (optional)
            <select name="studentId" className={fieldClass} defaultValue="">
              <option value="">None</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
