"use client";

import { useActionState } from "react";
import { Button } from "@epicenter/ui";
import { savePriorities, type ActionState } from "@/lib/actions/shortlist";

type Priorities = {
  top_priority: string | null;
  location_pref: string | null;
  financial_aid_needed: boolean;
  culture_pref: string | null;
} | null;

const initial: ActionState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-yellow";

// SU4 Screen 5: "What Do I Want Out of My List?" — a preferences worksheet, not
// a suggester. The counsellor still makes every reach/target/safety call.
export function PrioritiesForm({ priorities }: { priorities: Priorities }) {
  const [state, formAction, pending] = useActionState(savePriorities, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Top priority
          <input
            name="top_priority"
            defaultValue={priorities?.top_priority ?? ""}
            placeholder="e.g. Program strength"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Location
          <input
            name="location_pref"
            defaultValue={priorities?.location_pref ?? ""}
            placeholder="e.g. Urban"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Campus culture
          <input
            name="culture_pref"
            defaultValue={priorities?.culture_pref ?? ""}
            placeholder="e.g. Collaborative, not overly competitive"
            className={fieldClass}
          />
        </label>
        <label className="flex items-center gap-2.5 self-end pb-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            name="financial_aid_needed"
            defaultChecked={priorities?.financial_aid_needed ?? false}
            className="size-4 rounded border-border-strong text-yellow focus-visible:ring-2 focus-visible:ring-yellow"
          />
          Financial aid needed
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save my priorities"}
        </Button>
        {state.savedAt ? (
          <span role="status" className="text-sm text-complete-ink">
            Saved.
          </span>
        ) : null}
        {state.error ? (
          <span role="alert" className="text-sm text-error-ink">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
