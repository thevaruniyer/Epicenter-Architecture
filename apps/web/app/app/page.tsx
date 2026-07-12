import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Post-login router. Staff → counsellor shell. Students → onboarding (if a
// profile exists and isn't complete) or their Home.
export default async function AppRouterPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/counsellor/dashboard");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("onboarding_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile && !profile.onboarding_completed_at) redirect("/onboarding");
  redirect("/student/home");
}
