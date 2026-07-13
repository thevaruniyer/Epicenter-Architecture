import { test, expect } from "@playwright/test";
import { loginAsCounsellor } from "../support/auth";
import { clientFor, CREDS, STUDENT_ID } from "../support/db";

// Stage 5 draft-then-approve UI contract (CLAUDE.md §4): an AI output is only
// used after an explicit human save/approve, and the human can edit the draft
// first. These exercise the real UIs. Clean-up and checklist make live Gemini
// calls (generous timeouts); the nudge is a pure table read (deterministic).

// AI clean-up: the cleaned note only becomes a saved note after an explicit save.
test("AI Note Clean-Up applies only after explicit save", async ({ page }) => {
  const marker = `Ref-${Date.now()}`;
  const counsellor = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );

  await loginAsCounsellor(page);
  await page.goto(`/counsellor/students/${STUDENT_ID}/notes`);

  await page
    .getByLabel("New meeting note")
    .fill(`met w kabir today. discussed his essay. ${marker}. physics grade droppd.`);
  await page.getByRole("button", { name: "Clean up with AI" }).click();

  // The AI draft appears for review — but nothing is saved yet.
  await expect(page.getByText("AI-assisted draft", { exact: false })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(marker)).toHaveCount(0); // not in the saved list

  // Explicit save is the only thing that persists it — with a permanent badge.
  await page.getByRole("button", { name: "Save note" }).click();
  const saved = page.locator("li", { hasText: marker });
  await expect(saved).toBeVisible();
  await expect(saved.getByText("AI-assisted")).toBeVisible();

  // Cleanup.
  await counsellor
    .from("notes")
    .delete()
    .eq("student_id", STUDENT_ID)
    .ilike("final_text", `%${marker}%`);
});

// Requirement Checklist Extraction: the extracted checklist is editable before
// it is saved as the application's real requirements.
test("Requirement Checklist Extraction is editable before saving", async ({
  page,
}) => {
  const uni = `Extract Test ${Date.now()}`;
  const edited = `Personal statement (EDITED ${Date.now()})`;
  const counsellor = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );

  const { data: entry } = await counsellor
    .from("shortlist_entries")
    .insert({
      student_id: STUDENT_ID,
      university_name: uni,
      suggested_by: "counsellor",
      status: "approved",
      category: "target",
    })
    .select("id")
    .single();
  const entryId = entry!.id as string;
  await counsellor
    .from("applications")
    .insert({ shortlist_entry_id: entryId, student_id: STUDENT_ID, status: "preparing" });

  try {
    await loginAsCounsellor(page);
    await page.goto(`/counsellor/students/${STUDENT_ID}/applications`);
    const card = page.locator("div.shadow-glass").filter({ hasText: uni });

    await card.getByRole("button", { name: "Paste requirements" }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("textbox")
      .fill(
        "Personal statement (4000 characters). One academic reference. Full transcript, Grade 11 & 12.",
      );
    await dialog.getByRole("button", { name: "Extract checklist" }).click();

    // Editable rows appear BEFORE any save.
    await expect(dialog.getByText("Extracted checklist")).toBeVisible({
      timeout: 30_000,
    });
    const firstRow = dialog.getByRole("textbox").first();
    await expect(firstRow).toBeVisible();
    await firstRow.fill(edited); // prove it's editable before saving

    await dialog.getByRole("button", { name: "Save requirements" }).click();
    await expect(dialog).toBeHidden();

    // The edited row saved as a real requirement, AI-extracted badge and all.
    const req = card.locator("li", { hasText: edited });
    await expect(req).toBeVisible();
    await expect(req.getByText("AI-extracted")).toBeVisible();
  } finally {
    await counsellor
      .from("applications")
      .delete()
      .eq("shortlist_entry_id", entryId);
    await counsellor.from("shortlist_entries").delete().eq("id", entryId);
  }
});

// Category-aware nudge: renders the student's signals for the selected category
// (a pure table read — no live LLM when the panel opens).
test("Category-aware nudge renders in the +Add Task panel", async ({ page }) => {
  const tag = `stressed about the essay ${Date.now()}`;
  const counsellor = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );
  const { data: signal } = await counsellor
    .from("student_signals")
    .insert({ student_id: STUDENT_ID, category: "essay", tag_text: tag })
    .select("id")
    .single();
  const signalId = signal!.id as string;

  try {
    await loginAsCounsellor(page);
    await page.goto(`/counsellor/students/${STUDENT_ID}/roadmap`);
    await page.getByRole("button", { name: "+ Add task" }).click();
    const dialog = page.getByRole("dialog");

    // No nudge until a category is chosen; then the essay signal shows.
    await dialog.getByLabel("Category").selectOption("essay");
    await expect(dialog.getByText("From recent notes")).toBeVisible();
    await expect(dialog.getByText(tag)).toBeVisible();
  } finally {
    await counsellor.from("student_signals").delete().eq("id", signalId);
  }
});
