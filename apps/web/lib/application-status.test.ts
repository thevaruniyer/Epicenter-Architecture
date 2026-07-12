import { describe, it, expect } from "vitest";
import {
  canAdvanceApplication,
  canRecordDecision,
} from "./application-status";

describe("application status — ordered progression (never skips a step)", () => {
  it("walks the full happy path one step at a time", () => {
    expect(canAdvanceApplication("preparing", "submitted")).toBe(true);
    expect(canAdvanceApplication("submitted", "interview_requested")).toBe(true);
    expect(canAdvanceApplication("interview_requested", "offer_received")).toBe(
      true,
    );
  });

  it("allows skipping the OPTIONAL interview step, but never submitted", () => {
    expect(canAdvanceApplication("submitted", "offer_received")).toBe(true);
    // Cannot jump from preparing straight to an offer.
    expect(canAdvanceApplication("preparing", "offer_received")).toBe(false);
    expect(canAdvanceApplication("preparing", "interview_requested")).toBe(false);
  });

  it("cannot move backwards or out of a terminal status", () => {
    expect(canAdvanceApplication("submitted", "preparing")).toBe(false);
    expect(canAdvanceApplication("offer_received", "submitted")).toBe(false);
    expect(canAdvanceApplication("rejected", "submitted")).toBe(false);
    expect(canAdvanceApplication("preparing", "preparing")).toBe(false);
  });

  it("can reject from submitted or interview, not from preparing", () => {
    expect(canAdvanceApplication("submitted", "rejected")).toBe(true);
    expect(canAdvanceApplication("interview_requested", "rejected")).toBe(true);
    expect(canAdvanceApplication("preparing", "rejected")).toBe(false);
  });
});

describe("application decision — student accept/decline gate", () => {
  it("only on a received offer, and only once", () => {
    expect(canRecordDecision("offer_received", null, "accepted")).toBe(true);
    expect(canRecordDecision("offer_received", null, "declined")).toBe(true);
    // Not before an offer exists.
    expect(canRecordDecision("submitted", null, "accepted")).toBe(false);
    expect(canRecordDecision("preparing", null, "accepted")).toBe(false);
    // Not twice.
    expect(canRecordDecision("offer_received", "accepted", "declined")).toBe(
      false,
    );
  });
});
