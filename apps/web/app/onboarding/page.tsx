import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TOTAL_STEPS } from "@/lib/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingStepForm } from "@/components/onboarding/onboarding-step-form";

// Student onboarding wizard — resumes from student_profiles.onboarding_current_step.
export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/counsellor/dashboard");

  const supabase = await createClient();
  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase
      .from("student_profiles")
      .select(
        "grade, age, subjects, hobbies, intended_major, extracurriculars, onboarding_current_step, onboarding_completed_at",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  // No profile (not admin-created) or already onboarded → Home.
  if (!profile || profile.onboarding_completed_at) redirect("/student/home");

  const step = Math.min(
    Math.max(profile.onboarding_current_step ?? 0, 0),
    TOTAL_STEPS - 1,
  );

  return (
    <OnboardingShell step={step} totalSteps={TOTAL_STEPS}>
      <OnboardingStepForm
        step={step}
        profile={{ ...profile, full_name: userRow?.full_name ?? null }}
      />
    </OnboardingShell>
  );
}
