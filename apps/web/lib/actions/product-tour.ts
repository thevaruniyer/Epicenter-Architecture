"use server";

import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Stage 9 Prompt 9.10: marks the tour permanently seen, in the database, not
// localStorage — called the moment the tour engine mounts (not on finish),
// so a page refresh mid-tour reads completed on the next load and never
// restarts it. Students self-update via student_profiles (sp_update);
// everyone else self-updates via the narrow users_update_self_tour policy
// (packages/db/migrations/0012_product_tour_completion.sql), which only ever
// permits changing this one column.
export async function completeProductTour(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const supabase = await createClient();
  const now = new Date().toISOString();

  if (user.role === "student") {
    await supabase
      .from("student_profiles")
      .update({ product_tour_completed_at: now })
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("users")
      .update({ product_tour_completed_at: now })
      .eq("id", user.id);
  }
}
