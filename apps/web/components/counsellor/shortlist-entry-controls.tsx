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
import {
  reviewShortlistEntry,
  deleteShortlistEntry,
  type ActionState,
} from "@/lib/actions/shortlist";
import { convertToApplication } from "@/lib/actions/applications";
import type { ShortlistStatus, ShortlistCategory } from "@/lib/status-display";

const initial: ActionState = {};
const CATEGORIES: { value: ShortlistCategory; label: string }[] = [
  { value: "reach", label: "Reach" },
  { value: "target", label: "Target" },
  { value: "safety", label: "Safety" },
];

export function ShortlistEntryControls({
  studentId,
  entryId,
  status,
  category,
  converted,
}: {
  studentId: string;
  entryId: string;
  status: ShortlistStatus;
  category: ShortlistCategory | null;
  converted: boolean;
}) {
  const [review, reviewAction, reviewing] = useActionState(
    reviewShortlistEntry,
    initial,
  );
  const [convert, convertAction, converting] = useActionState(
    convertToApplication,
    initial,
  );
  const [pickedCategory, setPickedCategory] = useState<ShortlistCategory | "">(
    category ?? "",
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Categorise + approve (UC4 Screen 5). */}
        <form action={reviewAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="entryId" value={entryId} />
          <input type="hidden" name="studentId" value={studentId} />
          <div className="flex gap-1.5" role="group" aria-label="Category">
            {CATEGORIES.map((c) => (
              <label
                key={c.value}
                className={`cursor-pointer rounded-pill border px-2.5 py-1 text-xs font-bold transition-colors ${
                  pickedCategory === c.value
                    ? "border-ink bg-ink text-white"
                    : "border-border-strong text-ink-secondary hover:bg-surface-muted"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={pickedCategory === c.value}
                  onChange={() => setPickedCategory(c.value)}
                  className="sr-only"
                />
                {c.label}
              </label>
            ))}
          </div>
          <Button type="submit" size="sm" disabled={reviewing || !pickedCategory}>
            {status === "approved" ? "Update" : "Approve"}
          </Button>
        </form>

        {/* Convert to application (UC5) — only once approved and not yet live. */}
        {status === "approved" && !converted ? (
          <form action={convertAction}>
            <input type="hidden" name="entryId" value={entryId} />
            <input type="hidden" name="studentId" value={studentId} />
            <Button
              type="submit"
              variant="tertiary"
              size="sm"
              disabled={converting}
            >
              {converting ? "Converting…" : "Convert to Application →"}
            </Button>
          </form>
        ) : null}

        <DeleteEntryButton studentId={studentId} entryId={entryId} />
      </div>

      {review.error ? (
        <p role="alert" className="text-sm text-error-ink">
          {review.error}
        </p>
      ) : null}
      {convert.error ? (
        <p role="alert" className="text-sm text-error-ink">
          {convert.error}
        </p>
      ) : null}
    </div>
  );
}

// Deletion is destructive → a stronger centred confirm (Doctrine §23).
function DeleteEntryButton({
  studentId,
  entryId,
}: {
  studentId: string;
  entryId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteShortlistEntry,
    initial,
  );

  useEffect(() => {
    if (state.savedAt) setOpen(false);
  }, [state.savedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="sm">
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove this university?</DialogTitle>
          <DialogDescription>
            It will be removed from the student&rsquo;s shortlist. This can&rsquo;t
            be undone.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="entryId" value={entryId} />
          <input type="hidden" name="studentId" value={studentId} />
          {state.error ? (
            <p role="alert" className="mb-3 text-sm text-error-ink">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="tertiary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
