import { test, expect } from "@playwright/test";
import { loginAsCounsellor, loginAsStudent } from "../support/auth";
import { clientFor, CREDS } from "../support/db";

// UC10 + SU8. Native forms are fully functional end to end (no external
// account needed). Microsoft/Google Forms are "embed" paths — the counsellor
// pastes an externally-created form's share link; there's no API access to
// detect a real submission there, so the student instead confirms completion
// manually. Both are tested here since both are real, working app paths.
//
// Cleanup lives in afterEach (a hook Playwright guarantees runs regardless of
// how the test ended), not an in-body finally — a hard test timeout skips
// code after that point in the test body, and left orphaned forms behind on
// the seeded student's account the hard way once already (see
// reassignment.spec.ts).

let createdTitle: string | undefined;

test.afterEach(async () => {
  if (!createdTitle) return;
  const counsellor = await clientFor(CREDS.counsellor.email, CREDS.counsellor.password);
  const { data: form } = await counsellor
    .from("forms")
    .select("id")
    .eq("title", createdTitle)
    .maybeSingle();
  if (form) {
    await counsellor.from("form_responses").delete().eq("form_id", form.id);
    await counsellor.from("form_assignments").delete().eq("form_id", form.id);
    await counsellor.from("forms").delete().eq("id", form.id);
  }
  createdTitle = undefined;
});

test("native form: create, student responds, counsellor sees the response", async ({
  page,
}) => {
  const title = `Test Form ${Date.now()}`;
  createdTitle = title;

  await loginAsCounsellor(page);
  await page.goto("/counsellor/forms");
  await page.getByRole("button", { name: "+ Create Form" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByRole("textbox").nth(1).fill("What's your favourite subject?");

  await dialog.getByRole("radio", { name: "Choose Students" }).click();
  await dialog.getByRole("checkbox", { name: /Kabir Singh/ }).click();
  await dialog.getByRole("button", { name: "Create & Send" }).click();
  await expect(dialog).toBeHidden();

  const row = page.getByRole("listitem").filter({ hasText: title });
  await expect(row).toBeVisible();
  await expect(row.getByText("0 / 1 responded")).toBeVisible();

  // Student sees it on Home as a new To Do form card, fills it out.
  await loginAsStudent(page);
  await page.goto("/student/home");
  const formCard = page.getByRole("button", { name: new RegExp(title) });
  await expect(formCard).toBeVisible();
  await expect(formCard.getByText("New")).toBeVisible();
  await formCard.click();

  const responseDialog = page.getByRole("dialog");
  await responseDialog.getByRole("textbox").fill("Physics");
  await responseDialog.getByRole("button", { name: "Submit" }).click();
  await expect(responseDialog).toBeHidden();
  await expect(page.getByRole("button", { name: new RegExp(title) }).getByText("Complete")).toBeVisible();

  // Counsellor sees the real response, not a placeholder.
  await loginAsCounsellor(page);
  await page.goto("/counsellor/forms");
  await page.getByText(title).click();
  await expect(page.getByText("1 of 1 responded")).toBeVisible();
  // Both the aggregate tally ("Physics: 1") and the individual response
  // legitimately contain "Physics" — match the individual response's exact
  // rendered format (question prompt + curly-quoted answer) to disambiguate.
  await expect(page.getByText("favourite subject?: “Physics”")).toBeVisible();
});

test("embed form (Microsoft/Google): create with a share link, student acknowledges", async ({
  page,
}) => {
  const title = `Embed Form ${Date.now()}`;
  createdTitle = title;

  await loginAsCounsellor(page);
  await page.goto("/counsellor/forms");
  await page.getByRole("button", { name: "+ Create Form" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "Microsoft Forms" }).click();
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Share link").fill("https://forms.office.com/r/fake-test-link");

  await dialog.getByRole("radio", { name: "Choose Students" }).click();
  await dialog.getByRole("checkbox", { name: /Kabir Singh/ }).click();
  await dialog.getByRole("button", { name: "Create & Send" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(title)).toBeVisible();

  await loginAsStudent(page);
  await page.goto("/student/home");
  const formCard = page.getByRole("button", { name: new RegExp(title) });
  await formCard.click();

  const responseDialog = page.getByRole("dialog");
  await expect(responseDialog.locator("iframe")).toBeVisible();
  await responseDialog.getByRole("button", { name: "I've submitted this" }).click();
  await expect(responseDialog).toBeHidden();
  await expect(page.getByRole("button", { name: new RegExp(title) }).getByText("Complete")).toBeVisible();

  // Counsellor sees assignment status (not structured answers — there's no
  // API access into Microsoft/Google Forms to pull a real response back).
  await loginAsCounsellor(page);
  await page.goto("/counsellor/forms");
  await page.getByText(title).click();
  await expect(page.getByText("Complete")).toBeVisible();
});
