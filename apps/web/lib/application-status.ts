// Application-level status machine (Stage 4). Distinct from the tick-then-confirm
// requirement machine: this is the counsellor-driven, ORDERED outcome lifecycle
// plus the student's own accept/decline decision. The invariant that matters for
// the pilot is "never skips a step" — you cannot jump preparing → offer_received
// without passing through submitted, and a student can only ever record a decision
// on an offer that has actually been received.

import type { ApplicationStatus, Decision } from "@/lib/status-display";

// Allowed counsellor transitions, keyed by current status. Ordered progression;
// `rejected` and `offer_received` are terminal for the status field (decision is
// recorded separately). Interview is optional (submitted can go straight to an
// offer), but you can never skip submitted.
const COUNSELLOR_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  preparing: ["submitted"],
  submitted: ["interview_requested", "offer_received", "rejected"],
  interview_requested: ["offer_received", "rejected"],
  offer_received: [],
  rejected: [],
};

export function canAdvanceApplication(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  if (from === to) return false;
  return COUNSELLOR_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertAdvanceApplication(
  from: ApplicationStatus,
  to: ApplicationStatus,
): void {
  if (!canAdvanceApplication(from, to)) {
    throw new Error(`Illegal application transition: ${from} -> ${to}`);
  }
}

// A student may record a decision ONLY on an offer that has been received, and
// only once (no overwriting an existing decision here).
export function canRecordDecision(
  status: ApplicationStatus,
  existingDecision: Decision | null,
  decision: Decision,
): boolean {
  if (status !== "offer_received") return false;
  if (existingDecision) return false;
  return decision === "accepted" || decision === "declined";
}

export function assertRecordDecision(
  status: ApplicationStatus,
  existingDecision: Decision | null,
  decision: Decision,
): void {
  if (!canRecordDecision(status, existingDecision, decision)) {
    throw new Error(
      `Illegal decision "${decision}" on application status "${status}"`,
    );
  }
}
