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
  updateStudentProfile,
  type ProfileState,
} from "@/lib/actions/student-profile";

const initial: ProfileState = {};

const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

export function EditProfileDialog({
  studentId,
  intendedMajor,
  careerInterest,
  preferredCountries,
}: {
  studentId: string;
  intendedMajor: string;
  careerInterest: string;
  preferredCountries: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateStudentProfile,
    initial,
  );

  // Close the (centered) dialog once the save succeeds; parent re-renders with
  // the persisted values.
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Edit profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update the student&rsquo;s core preferences.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="studentId" value={studentId} />

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Intended major
            <input
              name="intended_major"
              defaultValue={intendedMajor}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Career interest
            <input
              name="career_interest"
              defaultValue={careerInterest}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Preferred countries
            <input
              name="preferred_countries"
              defaultValue={preferredCountries}
              placeholder="Comma separated, e.g. United Kingdom, Canada"
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
              {pending ? "Saving…" : "Save profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
