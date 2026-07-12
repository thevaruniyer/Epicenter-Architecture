// Reusable tick-then-confirm status machine (CLAUDE.md §4 non-negotiable).
//
// A student "ticks" an item (marks done / uploads → a pending-review state); only
// a counsellor "confirms" it to the terminal complete state. The terminal state
// is NEVER reached automatically and NEVER by a student. Roadmap tasks use it now;
// application requirements reuse the exact same machine in Stage 4.

export type Actor = "student" | "counsellor";

export interface TickThenConfirmModel<S extends string> {
  readonly states: readonly S[];
  /** The "ticked, awaiting confirmation" state. */
  readonly pendingReview: S;
  /** Terminal state — only a counsellor may set it, only from pendingReview. */
  readonly complete: S;
  /** States a student may move an item to, keyed by the current state. */
  readonly studentCanSetTo: Readonly<Partial<Record<S, readonly S[]>>>;
  /** States a counsellor may move an item to, keyed by the current state. */
  readonly counsellorCanSetTo: Readonly<Partial<Record<S, readonly S[]>>>;
}

export function canTransition<S extends string>(
  model: TickThenConfirmModel<S>,
  from: S,
  to: S,
  actor: Actor,
): boolean {
  if (from === to) return false;

  // Hard invariant, independent of the per-state tables: the terminal `complete`
  // state is set ONLY by a counsellor, ONLY from pendingReview. This is the
  // tick-then-confirm guarantee — it never auto-completes and a student can never
  // reach it.
  if (to === model.complete) {
    return actor === "counsellor" && from === model.pendingReview;
  }

  const allowed =
    actor === "student" ? model.studentCanSetTo[from] : model.counsellorCanSetTo[from];
  return allowed?.includes(to) ?? false;
}

export function assertTransition<S extends string>(
  model: TickThenConfirmModel<S>,
  from: S,
  to: S,
  actor: Actor,
): void {
  if (!canTransition(model, from, to, actor)) {
    throw new Error(
      `Illegal tick-then-confirm transition: ${from} -> ${to} by ${actor}`,
    );
  }
}

// --- Roadmap tasks ---------------------------------------------------------

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "complete";

export const TASK_MODEL: TickThenConfirmModel<TaskStatus> = {
  states: ["not_started", "in_progress", "pending_review", "complete"],
  pendingReview: "pending_review",
  complete: "complete",
  studentCanSetTo: {
    not_started: ["in_progress", "pending_review"],
    in_progress: ["pending_review"],
    pending_review: ["in_progress"], // retract before confirmation
  },
  counsellorCanSetTo: {
    not_started: ["in_progress", "pending_review"],
    in_progress: ["not_started", "pending_review"],
    pending_review: ["in_progress", "complete"], // send back OR confirm
    complete: ["in_progress"], // reopen
  },
};

// --- Application requirements (Stage 4 reuses this same machine) -----------

export type RequirementStatus =
  | "awaiting_student"
  | "submitted_awaiting_confirmation"
  | "needs_revision"
  | "complete";

export const REQUIREMENT_MODEL: TickThenConfirmModel<RequirementStatus> = {
  states: [
    "awaiting_student",
    "submitted_awaiting_confirmation",
    "needs_revision",
    "complete",
  ],
  pendingReview: "submitted_awaiting_confirmation",
  complete: "complete",
  studentCanSetTo: {
    awaiting_student: ["submitted_awaiting_confirmation"],
    needs_revision: ["submitted_awaiting_confirmation"],
  },
  counsellorCanSetTo: {
    submitted_awaiting_confirmation: ["needs_revision", "complete"],
    needs_revision: ["awaiting_student"],
    complete: ["awaiting_student"], // reopen
  },
};
