"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Dismiss a risk flag (passive feature — dismiss-only, no "resolve"). A new
// triggering event later creates a fresh flag; this just clears the current one.
export async function dismissRiskFlag(formData: FormData): Promise<void> {
  const flagId = String(formData.get("flagId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!flagId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("risk_flags")
    .update({ dismissed_at: new Date().toISOString(), dismissed_by: user?.id ?? null })
    .eq("id", flagId);

  revalidatePath(`/counsellor/students/${studentId}`);
}
