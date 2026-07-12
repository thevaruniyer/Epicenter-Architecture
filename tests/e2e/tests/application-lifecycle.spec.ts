import { test, expect } from "@playwright/test";
import { loginAsStudent, loginAsCounsellor } from "../support/auth";
import { clientFor, CREDS, STUDENT_ID } from "../support/db";

// UC5 / SU6 / SU7: one student, the whole application lifecycle end to end —
//   preparing → submitted → interview_requested → offer_received → accepted
// driven entirely through the real UIs and RLS. Every transition is gated: the
// counsellor is never offered a button that skips a step, and the accept is the
// student's own action on a received offer.
test("full application lifecycle, one gated step at a time", async ({ page }) => {
  const uni = `Oxford ${Date.now()}`;

  const counsellor = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );

  // Seed an APPROVED shortlist entry (the pre-condition for conversion).
  const { data: entry, error } = await counsellor
    .from("shortlist_entries")
    .insert({
      student_id: STUDENT_ID,
      university_name: uni,
      course: "Law (Jurisprudence)",
      country: "UK",
      suggested_by: "counsellor",
      status: "approved",
      category: "target",
    })
    .select("id")
    .single();
  expect(error).toBeNull();
  const entryId = entry!.id as string;

  try {
    // --- Counsellor: convert to a live application (two-click, UC5) ----------
    await loginAsCounsellor(page);
    await page.goto(`/counsellor/students/${STUDENT_ID}/shortlist`);
    const slRow = page.locator("li", { hasText: uni });
    await slRow.getByRole("button", { name: "Convert to Application" }).click();
    // Wait for the conversion to land (pill flips to "Converted") before moving
    // on — navigating early would abort the in-flight server action.
    await expect(slRow.getByText("Converted")).toBeVisible();

    await page.goto(`/counsellor/students/${STUDENT_ID}/applications`);
    const card = page.locator("div.shadow-glass").filter({ hasText: uni });
    await expect(card.getByText("Preparing")).toBeVisible();

    // Never skips a step: at "preparing" the ONLY move offered is submit — no
    // jump straight to interview or offer.
    await expect(
      card.getByRole("button", { name: "Interview requested" }),
    ).toHaveCount(0);
    await expect(
      card.getByRole("button", { name: "Record offer" }),
    ).toHaveCount(0);

    // preparing → submitted
    await card.getByRole("button", { name: "Mark submitted" }).click();
    await expect(card.getByText("Submitted")).toBeVisible();

    // submitted → interview_requested
    await card.getByRole("button", { name: "Interview requested" }).click();
    await expect(card.getByText("Interview requested")).toBeVisible();

    // interview_requested → offer_received (captures conditions + deposit)
    await card.getByRole("button", { name: "Record offer" }).click();
    const offer = page.getByRole("dialog");
    await offer.getByLabel("Conditions").fill("A*AA at final results");
    await offer.getByLabel("Deposit deadline").fill("2026-01-10");
    await offer.getByRole("button", { name: "Record offer" }).click();
    await expect(offer).toBeHidden();
    await expect(card.getByText("Offer received")).toBeVisible();

    // --- Student: sees the offer and records their OWN decision (SU7) --------
    await page.context().clearCookies();
    await loginAsStudent(page);
    await page.goto("/student/application");
    const sCard = page.locator("div.shadow-glass").filter({ hasText: uni });
    await expect(sCard.getByText("Offer received")).toBeVisible();
    await expect(sCard.getByText("A*AA at final results")).toBeVisible();

    await sCard.getByRole("button", { name: "Record my decision" }).click();
    const decision = page.getByRole("dialog");
    // Input is sr-only; click its label.
    await decision.getByText("Accept", { exact: true }).click();
    await decision.getByRole("button", { name: "Confirm" }).click();
    await expect(decision).toBeHidden();
    await expect(sCard.getByText("Offer accepted")).toBeVisible();

    // --- Persisted at the terminal, correct state ---------------------------
    const { data: app } = await counsellor
      .from("applications")
      .select("status, decision")
      .eq("shortlist_entry_id", entryId)
      .single();
    expect(app!.status).toBe("offer_received");
    expect(app!.decision).toBe("accepted");
  } finally {
    // Cleanup (application first — requirements cascade — then the entry).
    await counsellor
      .from("applications")
      .delete()
      .eq("shortlist_entry_id", entryId);
    await counsellor.from("shortlist_entries").delete().eq("id", entryId);
  }
});
