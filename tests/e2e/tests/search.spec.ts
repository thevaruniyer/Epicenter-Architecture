import { test, expect } from "@playwright/test";
import { loginAsCounsellor, loginAsStudent } from "../support/auth";

// Stage 6.5 Prompt 6.5.6: functional shadcn Command search, role-scoped,
// working identically from any screen in each shell (not just Students grid).

test.describe("Counsellor search", () => {
  test("finds a student by name from a non-Students-grid screen", async ({ page }) => {
    await loginAsCounsellor(page);
    await page.goto("/counsellor/dashboard");

    await page.getByRole("button", { name: "Search students, notes," }).click();
    await page.getByRole("combobox").fill("Kabir");
    await expect(page.getByRole("option", { name: "Kabir Singh" })).toBeVisible();
    await page.getByRole("option", { name: "Kabir Singh" }).click();

    await expect(page).toHaveURL(/\/counsellor\/students\/[^/]+$/);
  });

  test("finds an application by university name", async ({ page }) => {
    await loginAsCounsellor(page);
    await page.goto("/counsellor/dashboard");

    await page.getByRole("button", { name: "Search students, notes," }).click();
    await page.getByRole("combobox").fill("Oxford");
    const result = page.getByRole("option", { name: /Oxford/ });
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(/\/counsellor\/students\/[^/]+\/applications/);
  });
});

test.describe("Student search", () => {
  test("finds a roadmap task from Home and navigates to Roadmap", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/home");

    await page.getByRole("button", { name: "Search notes, roadmap," }).click();
    await page.getByRole("combobox").fill("CV");
    const result = page.getByRole("option", { name: /Upload your latest CV/ });
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL("/student/roadmap");
  });

  // Highest-value RLS check (CLAUDE.md §4): a private counsellor note must
  // never be reachable through any route, including search. Search "Imperial"
  // (part of the query, echoed back in the empty-state message) but assert
  // on "manage gently" — text from the note body itself, never UI chrome —
  // so a leaked result can't hide behind the query-echo false positive.
  test("never surfaces a private counsellor note", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/home");

    await page.getByRole("button", { name: "Search notes, roadmap," }).click();
    await page.getByRole("combobox").fill("Imperial");
    await expect(page.getByText("No results for")).toBeVisible();
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(page.getByText(/manage gently/)).toHaveCount(0);
  });
});
