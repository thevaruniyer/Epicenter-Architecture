import { test, expect } from "@playwright/test";
import { loginAsCounsellor } from "../support/auth";

// Kabir Singh — seeded fixture student on counsellor1's caseload.
const KABIR_ID = "60000000-0000-0000-0000-000000000001";

test.describe("Students grid + Overview/Profile", () => {
  test("grid loads and shows seeded students", async ({ page }) => {
    await loginAsCounsellor(page);
    await page.goto("/counsellor/students");

    await expect(
      page.getByRole("heading", { name: "Your caseload" }),
    ).toBeVisible();
    await expect(page.getByText("Kabir Singh")).toBeVisible();
    await expect(page.getByText("Ananya Kapoor")).toBeVisible();
    await expect(page.getByText("Meera Iyer")).toBeVisible();
  });

  test("multi-select mode works", async ({ page }) => {
    await loginAsCounsellor(page);
    await page.goto("/counsellor/students");

    await page.getByRole("button", { name: "Select" }).click();
    // In select mode, cards become toggle buttons.
    await page.getByRole("button", { name: /Kabir Singh/ }).click();
    await expect(page.getByText("1 selected")).toBeVisible();

    await page.getByRole("button", { name: /Ananya Kapoor/ }).click();
    await expect(page.getByText("2 selected")).toBeVisible();
  });

  test("Edit Profile opens centered, saves the expanded fields, and persists", async ({
    page,
  }) => {
    await loginAsCounsellor(page);
    await page.goto(`/counsellor/students/${KABIR_ID}`);

    await page.getByRole("button", { name: "Edit profile" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Centered on screen (CLAUDE.md §4).
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    const dialogCenterX = box!.x + box!.width / 2;
    expect(Math.abs(dialogCenterX - viewport!.width / 2)).toBeLessThan(48);

    // Save a unique value so persistence is unambiguous.
    const major = `Computer Science & AI ${Date.now()}`;
    await dialog.getByLabel("Intended major").fill(major);
    await dialog.getByRole("button", { name: "Save profile" }).click();

    // Dialog closes; the new value re-renders on the page.
    await expect(dialog).toBeHidden();
    await expect(page.getByText(major).first()).toBeVisible();

    // Actually persisted: still there after a fresh load.
    await page.reload();
    await expect(page.getByText(major).first()).toBeVisible();
  });
});
