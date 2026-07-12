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
import { recordDecision, type ActionState } from "@/lib/actions/applications";

const initial: ActionState = {};

// SU7: the student records their own accept/decline on a received offer — a
// deliberate action, never inferred. A stronger centred confirm (Doctrine §23),
// since it's a high-impact, hard-to-reverse decision.
export function RecordDecisionControls({
  applicationId,
}: {
  applicationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<"accepted" | "declined" | "">("");
  const [state, formAction, pending] = useActionState(recordDecision, initial);

  useEffect(() => {
    if (state.savedAt) setOpen(false);
  }, [state.savedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Record my decision</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record my decision</DialogTitle>
          <DialogDescription>
            This is your decision to make. Your counsellor sees it immediately.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <div className="flex gap-2" role="group" aria-label="Decision">
            {(["accepted", "declined"] as const).map((c) => (
              <label
                key={c}
                className={`flex-1 cursor-pointer rounded-md border px-3 py-2.5 text-center text-sm font-bold capitalize transition-colors ${
                  choice === c
                    ? "border-ink bg-ink text-white"
                    : "border-border-strong text-ink-secondary hover:bg-surface-muted"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value={c}
                  checked={choice === c}
                  onChange={() => setChoice(c)}
                  className="sr-only"
                />
                {c === "accepted" ? "Accept" : "Decline"}
              </label>
            ))}
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
            <Button type="submit" disabled={pending || !choice}>
              {pending ? "Recording…" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
