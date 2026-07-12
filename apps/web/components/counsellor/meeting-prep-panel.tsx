"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { AiBadge, Button, Card } from "@epicenter/ui";
import { prepareMeeting, type PrepState } from "@/lib/actions/meeting-prep";

const initial: PrepState = {};

// Meeting Prep Briefing panel (§1.11). PULL-based: the briefing only generates
// when the counsellor taps "Prep Notes" — never auto-pushed. Drops into a
// calendar meeting once the Calendar feature is built; the props are the meeting
// and its student.
export function MeetingPrepPanel({
  studentId,
  meetingId,
}: {
  studentId: string;
  meetingId: string;
}) {
  const [state, action, pending] = useActionState(prepareMeeting, initial);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Meeting prep</h3>
          <p className="text-xs text-ink-secondary">
            A quick catch-up before your meeting — generated only when you ask.
          </p>
        </div>
        <form action={action}>
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="meetingId" value={meetingId} />
          <Button type="submit" variant="tertiary" size="sm" disabled={pending}>
            <Sparkles className="size-4" aria-hidden />
            {pending ? "Pulling it together…" : "Prep Notes"}
          </Button>
        </form>
      </div>

      {state.briefing ? (
        <div className="mt-3 border-t border-border-soft pt-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-ink">Briefing</span>
            <AiBadge label="AI-generated" />
          </div>
          <p className="whitespace-pre-wrap text-sm text-ink-secondary">
            {state.briefing}
          </p>
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-error-ink">
          {state.error}
        </p>
      ) : null}
    </Card>
  );
}
