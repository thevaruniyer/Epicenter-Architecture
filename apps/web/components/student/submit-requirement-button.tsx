"use client";

import { useActionState } from "react";
import { Button } from "@epicenter/ui";
import { submitRequirement, type ActionState } from "@/lib/actions/applications";

const initial: ActionState = {};

// The student's TICK: submit a requirement for the counsellor to confirm. Shown
// while the requirement is awaiting the student or was sent back for revision.
export function SubmitRequirementButton({
  requirementId,
  label,
}: {
  requirementId: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(submitRequirement, initial);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="requirementId" value={requirementId} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Submitting…" : label}
        </Button>
      </form>
      {state.error ? (
        <p role="alert" className="text-xs text-error-ink">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
