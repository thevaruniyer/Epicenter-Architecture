import { StatusPill, type PillStatus } from "@epicenter/ui";
import type { RequirementStatus } from "@/lib/tick-then-confirm";

// Single source of truth for how Stage-4 domain statuses render as Doctrine §7
// pills with Doctrine §29 status language ("Waiting for counsellor review", not
// a bare "Pending"). Colour + icon + label, never colour alone.

export type ShortlistStatus = "awaiting_review" | "suggested" | "approved";
export type ApplicationStatus =
  | "preparing"
  | "submitted"
  | "interview_requested"
  | "offer_received"
  | "rejected";
export type Decision = "accepted" | "declined";

export type ShortlistCategory = "reach" | "target" | "safety";

// --- Shortlist entry status -------------------------------------------------
const SHORTLIST: Record<ShortlistStatus, { pill: PillStatus; label: string }> = {
  awaiting_review: { pill: "pending", label: "Awaiting review" },
  suggested: { pill: "neutral", label: "Suggested" },
  approved: { pill: "complete", label: "Approved" },
};

export function ShortlistStatusPill({
  status,
  converted = false,
}: {
  status: ShortlistStatus;
  converted?: boolean;
}) {
  // A converted entry (a live application exists) reads as "Converted" regardless
  // of its stored review status.
  if (converted) return <StatusPill status="target" label="Converted" />;
  const { pill, label } = SHORTLIST[status];
  return <StatusPill status={pill} label={label} />;
}

export function CategoryPill({ category }: { category: ShortlistCategory }) {
  return <StatusPill status={category} />;
}

// --- Application status ------------------------------------------------------
const APPLICATION: Record<
  ApplicationStatus,
  { pill: PillStatus; label: string }
> = {
  preparing: { pill: "neutral", label: "Preparing" },
  submitted: { pill: "neutral", label: "Submitted" },
  interview_requested: { pill: "neutral", label: "Interview requested" },
  offer_received: { pill: "reach", label: "Offer received" },
  rejected: { pill: "overdue", label: "Not successful" },
};

export function ApplicationStatusPill({
  status,
  decision,
}: {
  status: ApplicationStatus;
  decision?: Decision | null;
}) {
  // A recorded decision supersedes the raw status in the pill.
  if (decision === "accepted")
    return <StatusPill status="complete" label="Offer accepted" />;
  if (decision === "declined")
    return <StatusPill status="neutral" label="Offer declined" />;
  const { pill, label } = APPLICATION[status];
  return <StatusPill status={pill} label={label} />;
}

// --- Application requirement lifecycle (tick-then-confirm) -------------------
// Doctrine §29: language speaks to the reader. A student sees "Your turn"; the
// counsellor sees who they're waiting on. `submitted_awaiting_confirmation`
// always reads as "Waiting for counsellor review".
const REQUIREMENT: Record<
  RequirementStatus,
  { pill: PillStatus; student: string; counsellor: string }
> = {
  awaiting_student: {
    pill: "neutral",
    student: "Your turn",
    counsellor: "Awaiting student",
  },
  submitted_awaiting_confirmation: {
    pill: "pending",
    student: "Waiting for counsellor review",
    counsellor: "Waiting for your review",
  },
  needs_revision: {
    pill: "overdue",
    student: "Needs revision",
    counsellor: "Sent back for revision",
  },
  complete: { pill: "complete", student: "Complete", counsellor: "Complete" },
};

export function RequirementStatusPill({
  status,
  audience,
}: {
  status: RequirementStatus;
  audience: "student" | "counsellor";
}) {
  const r = REQUIREMENT[status];
  return <StatusPill status={r.pill} label={r[audience]} />;
}
