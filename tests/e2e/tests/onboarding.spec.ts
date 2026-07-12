import { test, expect, type Page } from "@playwright/test";
import { ONBOARDING_STUDENT, resetOnboardingStudent } from "../support/db";

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

test("a brand-new student completes all 6 steps and lands on the sparse Home", async ({
  page,
}) => {
  await loginAndStartOnboarding(page);

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
  await page.fill('textarea[name="extracurriculars"]', "Robotics Club — Team Lead");
  await page.getByRole("button", { name: "Finish" }).click();

  // Lands on the sparse Home — no resume banner.
  await page.waitForURL("**/student/home");
  await expect(page.getByText("Your journey starts here")).toBeVisible();
  await expect(page.getByText("Finish setting up your profile")).toHaveCount(0);
});

test("skipping shows the resume banner on Home and resumes from the saved step", async ({
  page,
}) => {
  await loginAndStartOnboarding(page);

  // Advance one step (age → grade) so the saved step is not the first.
  await expect(page.getByRole("heading", { name: "How old are you?" })).toBeVisible();
  await page.fill('input[name="age"]', "17");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "What grade are you in?" })).toBeVisible();

  // Skip → Home with the resume banner.
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/student/home");
  await expect(page.getByText("Finish setting up your profile")).toBeVisible();

  // Resume → back into onboarding at the saved step (grade, not age).
  await page.getByRole("link", { name: "Resume" }).click();
  await page.waitForURL("**/onboarding");
  await expect(page.getByRole("heading", { name: "What grade are you in?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How old are you?" })).toHaveCount(0);
});
