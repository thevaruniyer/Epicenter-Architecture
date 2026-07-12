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
import { advanceApplication, type ActionState } from "@/lib/actions/applications";
import type { ApplicationStatus } from "@/lib/status-display";

const initial: ActionState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

// The next steps a counsellor may take from the current status. Mirrors the
// server-side ordered machine (application-status.ts) — the button set never
// offers a step that skips ahead.
const NEXT: Record<
  ApplicationStatus,
  { to: ApplicationStatus; label: string; variant?: "tertiary" }[]
> = {
  preparing: [{ to: "submitted", label: "Mark submitted" }],
  submitted: [
    { to: "interview_requested", label: "Interview requested" },
    { to: "offer_received", label: "Record offer" },
    { to: "rejected", label: "Not successful", variant: "tertiary" },
  ],
  interview_requested: [
    { to: "offer_received", label: "Record offer" },
    { to: "rejected", label: "Not successful", variant: "tertiary" },
  ],
  offer_received: [],
  rejected: [],
};

export function AdvanceApplicationControls({
  applicationId,
  studentId,
  status,
}: {
  applicationId: string;
  studentId: string;
  status: ApplicationStatus;
}) {
  const [state, formAction, pending] = useActionState(advanceApplication, initial);
  const steps = NEXT[status];

  if (steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s) =>
          s.to === "offer_received" ? (
            <OfferDialog
              key={s.to}
              applicationId={applicationId}
              studentId={studentId}
            />
          ) : (
            <form key={s.to} action={formAction}>
              <input type="hidden" name="applicationId" value={applicationId} />
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="to" value={s.to} />
              <Button
                type="submit"
                size="sm"
                variant={s.variant ?? "primary"}
                disabled={pending}
              >
                {s.label}
              </Button>
            </form>
          ),
        )}
      </div>
      {state.error ? (
        <p role="alert" className="text-xs text-error-ink">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

// Recording an offer captures its conditions + deposit deadline (SU7).
function OfferDialog({
  applicationId,
  studentId,
}: {
  applicationId: string;
  studentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(advanceApplication, initial);

  useEffect(() => {
    if (state.savedAt) setOpen(false);
  }, [state.savedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Record offer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record offer</DialogTitle>
          <DialogDescription>
            The student sees these details and can then record their decision.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="to" value="offer_received" />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Conditions{" "}
            <span className="font-normal text-ink-tertiary">(optional)</span>
            <input
              name="offer_conditions"
              placeholder="e.g. A*AA required at final results"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Deposit deadline{" "}
            <span className="font-normal text-ink-tertiary">(optional)</span>
            <input type="date" name="deposit_deadline" className={fieldClass} />
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
              {pending ? "Recording…" : "Record offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
