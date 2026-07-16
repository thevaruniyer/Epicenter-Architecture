"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@epicenter/ui";
import { MeetingPrepPanel } from "@/components/counsellor/meeting-prep-panel";
import type { CalendarEvent } from "@/components/counsellor/calendar-view";

// UC9 Screen 5: event detail popover with Prep Notes. Only native events tied
// to a student have a real meeting to prep for; Google-sourced events (no
// studentId — they aren't Epicenter records) just show their details.
// Meeting Prep is a counsellor-internal AI feature (CLAUDE.md §4 — essay
// feedback and meeting prep are never shown to students) — showPrep=false on
// the student calendar hides it regardless of event shape.
export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  showPrep = true,
}: {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showPrep?: boolean;
}) {
  const time = `${new Date(event.startsAt).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {event.title}
            {event.studentName ? `, ${event.studentName}` : ""}
          </DialogTitle>
          <DialogDescription>{time}</DialogDescription>
        </DialogHeader>

        {showPrep && event.source === "native" && event.studentId ? (
          <MeetingPrepPanel studentId={event.studentId} meetingId={event.id} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
