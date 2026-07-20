import { test, expect, type Page } from "@playwright/test";
import { ONBOARDING_STUDENT, ORPHANED_SIGNUP_STUDENT, resetOnboardingStudent } from "../support/db";

// Both tests share the one onboarding fixture student, so run them serially and
// reset the student to un-onboarded before each.
test.describe.configure({ mode: "serial" });

async function loginAndStartOnboarding(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", ONBOARDING_STUDENT.email);
  await page.fill("#password", ONBOARDING_STUDENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/onboarding");
}

test.beforeEach(async () => {
  await resetOnboardingStudent();
});

test("a brand-new student completes all 7 steps and lands on the sparse Home with their real name", async ({
  page,
}) => {
  await loginAndStartOnboarding(page);

  await expect(page.getByRole("heading", { name: "What's your name?" })).toBeVisible();
  await page.fill('input[name="full_name"]', "Priya Sharma");
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "How old are you?" })).toBeVisible();
  await page.fill('input[name="age"]', "16");
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "What grade are you in?" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "What subjects do you take?" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: /hobbies/i })).toBeVisible();
  await page.fill('textarea[name="hobbies"]', "Robotics, chess");
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: /intended major/i })).toBeVisible();
  await page.fill('input[name="intended_major"]', "Computer Science");
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: /EC list/i })).toBeVisible();
  await page.fill('textarea[name="extracurriculars"]', "Robotics Club, Team Lead");
  await page.getByRole("button", { name: "Finish" }).click();

  // Lands on the sparse Home — no resume banner, and the name entered at
  // step 1 actually shows up in the greeting, not just saved to the DB. The
  // ?welcome=1 flag (Stage 10 Prompt 10.6) triggers the welcome sequence, but
  // the underlying dashboard content is still real and checkable underneath it.
  await page.waitForURL("**/student/home**");
  await expect(page.getByRole("heading", { name: "Hi Priya" })).toBeVisible();
  await expect(page.getByText("Your journey starts here")).toBeVisible();
  await expect(page.getByText("Finish setting up your profile")).toHaveCount(0);
});

test("skipping shows the resume banner on Home and resumes from the saved step", async ({
  page,
}) => {
  await loginAndStartOnboarding(page);

  // Advance two steps (name → age → grade) so the saved step is not the first.
  await expect(page.getByRole("heading", { name: "What's your name?" })).toBeVisible();
  await page.fill('input[name="full_name"]', "Priya Sharma");
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "How old are you?" })).toBeVisible();
  await page.fill('input[name="age"]', "17");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "What grade are you in?" })).toBeVisible();

  // Skip → Home with the resume banner.
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/student/home");
  await expect(page.getByText("Finish setting up your profile")).toBeVisible();

  // Resume → back into onboarding at the saved step (grade, not name/age).
  await page.getByRole("link", { name: "Resume" }).click();
  await page.waitForURL("**/onboarding");
  await expect(page.getByRole("heading", { name: "What grade are you in?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What's your name?" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "How old are you?" })).toHaveCount(0);
});

// Stage 9 Prompt 9.2: the onboarding-gate bug — a student with no
// student_profiles row silently fell through to Home instead of onboarding.
// This fixture starts with no row at all (see
// packages/db/tests/seed_orphaned_signup_fixture.sql); signIn()'s
// ensureStudentProfile() must create one on first login so the existing
// app/page.tsx redirect logic (untouched by this fix) has a real row to read.
test("a self-signup student with no profile row yet is routed into onboarding on first login, not Home", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("#email", ORPHANED_SIGNUP_STUDENT.email);
  await page.fill("#password", ORPHANED_SIGNUP_STUDENT.password);
  await page.click('button[type="submit"]');

  await page.waitForURL("**/onboarding");
  await expect(page.getByRole("heading", { name: "What's your name?" })).toBeVisible();
});
