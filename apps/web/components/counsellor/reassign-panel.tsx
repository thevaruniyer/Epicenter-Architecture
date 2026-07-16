"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from "@epicenter/ui";
import { reassignStudents, type ReassignState } from "@/lib/actions/team";
import type { CounsellorLoad } from "@/components/counsellor/team-view";

const initial: ReassignState = {};

// UC6 reassign panel: select students -> pick a destination -> a stronger,
// named confirmation step before the write fires (Doctrine §23 — reassignment
// is a high-impact action, not a lightweight inline confirm).
export function ReassignPanel({
  open,
  onOpenChange,
  from,
  destinations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: CounsellorLoad;
  destinations: CounsellorLoad[];
}) {
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [toCounsellorId, setToCounsellorId] = useState(destinations[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(reassignStudents, initial);

  // Reset to a clean slate whenever the panel opens for a (possibly new) source.
  useEffect(() => {
    if (open) {
      setStep("select");
      setChecked(new Set());
      setToCounsellorId(destinations[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, from.id]);

  useEffect(() => {
    if (state.reassignedAt) onOpenChange(false);
  }, [state.reassignedAt, onOpenChange]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedStudents = from.students.filter((s) => checked.has(s.id));
  const toName = destinations.find((d) => d.id === toCounsellorId)?.name ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {step === "select" ? (
          <>
            <DialogHeader>
              <DialogTitle>Reassign Students</DialogTitle>
              <DialogDescription>
                Choose which of {from.name}&rsquo;s students move to a new
                counsellor.
              </DialogDescription>
            </DialogHeader>

            <ul className="flex flex-col divide-y divide-border-soft">
              {from.students.map((s) => {
                const isChecked = checked.has(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => toggle(s.id)}
                      className="flex w-full items-center gap-3 px-1 py-2 text-left text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded border",
                          isChecked
                            ? "border-yellow bg-yellow"
                            : "border-border-strong bg-surface-raised",
                        )}
                      />
                      {s.name}
                    </button>
                  </li>
                );
              })}
            </ul>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Move To
              <select
                value={toCounsellorId}
                onChange={(e) => setToCounsellorId(e.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setStep("confirm")}
                disabled={checked.size === 0 || !toCounsellorId}
              >
                Confirm Reassignment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm reassignment</DialogTitle>
              <DialogDescription>
                {selectedStudents.length} student
                {selectedStudents.length === 1 ? "" : "s"} will move from{" "}
                {from.name} to {toName}: {selectedStudents.map((s) => s.name).join(", ")}.{" "}
                {toName} will immediately see every note, task, and shortlist
                decision {from.name} made, plus a permanent AI-generated handoff
                summary. This updates who is responsible for these students right
                away. You can reassign them again later, but this specific
                action can&rsquo;t be undone.
              </DialogDescription>
            </DialogHeader>

            {state.error ? (
              <p role="alert" className="text-sm text-error-ink">
                {state.error}
              </p>
            ) : null}

            <form action={formAction}>
              <input type="hidden" name="fromCounsellorId" value={from.id} />
              <input type="hidden" name="toCounsellorId" value={toCounsellorId} />
              <input
                type="hidden"
                name="studentIds"
                value={selectedStudents.map((s) => s.id).join(",")}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => setStep("select")}
                  disabled={pending}
                >
                  Back
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Reassigning…" : "Reassign"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
