"use client";

import { useActionState } from "react";
import { Button } from "@epicenter/ui";
import { reviewRequirement, type ActionState } from "@/lib/actions/applications";

const initial: ActionState = {};

// The CONFIRM half of tick-then-confirm for application requirements: a counsellor
// confirms a submitted requirement to `complete`, or sends it back for revision.
// Only shown while a requirement is awaiting the counsellor's review.
export function RequirementReviewControls({
  requirementId,
  studentId,
}: {
  requirementId: string;
  studentId: string;
}) {
  const [state, formAction, pending] = useActionState(reviewRequirement, initial);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <form action={formAction}>
          <input type="hidden" name="requirementId" value={requirementId} />
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="decision" value="needs_revision" />
          <Button type="submit" variant="tertiary" size="sm" disabled={pending}>
            Send back
          </Button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="requirementId" value={requirementId} />
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="decision" value="complete" />
          <Button type="submit" size="sm" disabled={pending}>
            Confirm
          </Button>
        </form>
      </div>
      {state.error ? (
        <p role="alert" className="text-xs text-error-ink">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
