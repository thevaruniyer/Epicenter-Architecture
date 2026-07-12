"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Dismiss a stalled-task alert (passive feature — dismiss-only). If the task is
// still stalled at the next detection pass it will surface as a fresh alert.
export async function dismissStalledAlert(formData: FormData): Promise<void> {
  const alertId = String(formData.get("alertId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!alertId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("stalled_task_alerts")
    .update({ dismissed_at: new Date().toISOString(), dismissed_by: user?.id ?? null })
    .eq("id", alertId);

  revalidatePath(`/counsellor/students/${studentId}/roadmap`);
}
