import { describe, expect, it } from "vitest";
import {
  canTransition,
  assertTransition,
  REQUIREMENT_MODEL,
  TASK_MODEL,
} from "./tick-then-confirm";

describe("tick-then-confirm — tasks", () => {
  it("a student can tick a task into pending_review", () => {
    expect(canTransition(TASK_MODEL, "not_started", "pending_review", "student")).toBe(true);
    expect(canTransition(TASK_MODEL, "in_progress", "pending_review", "student")).toBe(true);
  });

  it("a student can NEVER set complete (from any state)", () => {
    for (const from of TASK_MODEL.states) {
      expect(canTransition(TASK_MODEL, from, "complete", "student")).toBe(false);
    }
  });

  it("only a counsellor confirms, and only from pending_review", () => {
    expect(canTransition(TASK_MODEL, "pending_review", "complete", "counsellor")).toBe(true);
    // never a shortcut to complete
    expect(canTransition(TASK_MODEL, "not_started", "complete", "counsellor")).toBe(false);
    expect(canTransition(TASK_MODEL, "in_progress", "complete", "counsellor")).toBe(false);
  });

  it("a counsellor can send a pending_review task back to in_progress", () => {
    expect(canTransition(TASK_MODEL, "pending_review", "in_progress", "counsellor")).toBe(true);
  });

  it("no-op transitions are rejected", () => {
    expect(canTransition(TASK_MODEL, "complete", "complete", "counsellor")).toBe(false);
  });

  it("assertTransition throws on an illegal move", () => {
    expect(() => assertTransition(TASK_MODEL, "not_started", "complete", "counsellor")).toThrow();
    expect(() => assertTransition(TASK_MODEL, "pending_review", "complete", "counsellor")).not.toThrow();
  });
});

describe("tick-then-confirm — requirements (Stage 4 reuse)", () => {
  it("student submits into the pending-review state", () => {
    expect(
      canTransition(REQUIREMENT_MODEL, "awaiting_student", "submitted_awaiting_confirmation", "student"),
    ).toBe(true);
  });

  it("student can never set complete", () => {
    for (const from of REQUIREMENT_MODEL.states) {
      expect(canTransition(REQUIREMENT_MODEL, from, "complete", "student")).toBe(false);
    }
  });

  it("only a counsellor confirms, and only from the submitted state", () => {
    expect(
      canTransition(REQUIREMENT_MODEL, "submitted_awaiting_confirmation", "complete", "counsellor"),
    ).toBe(true);
    expect(canTransition(REQUIREMENT_MODEL, "awaiting_student", "complete", "counsellor")).toBe(false);
    expect(canTransition(REQUIREMENT_MODEL, "needs_revision", "complete", "counsellor")).toBe(false);
  });
});
