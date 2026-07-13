"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { generateAndStoreHandoff } from "@/lib/handoff";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReassignState = { error?: string; reassignedAt?: number };

// UC6: reassign a set of a counsellor's students to a different counsellor.
// counsellor_caseloads already fully permits Head of Counselling writes (RLS);
// student_profiles.assigned_counsellor_id — the field counsels_student() reads
// everywhere else — needed a matching is_head() grant (migration 0008).
export async function reassignStudents(
  _prev: ReassignState,
  formData: FormData,
): Promise<ReassignState> {
  const user = await getSessionUser();
  if (user?.role !== "head_of_counselling") {
    return { error: "Only Head of Counselling can reassign students." };
  }

  const fromCounsellorId = String(formData.get("fromCounsellorId") ?? "");
  const toCounsellorId = String(formData.get("toCounsellorId") ?? "");
  const studentIds = String(formData.get("studentIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!fromCounsellorId || !toCounsellorId) {
    return { error: "Choose who to reassign these students to." };
  }
  if (toCounsellorId === fromCounsellorId) {
    return { error: "Pick a different counsellor to reassign to." };
  }
  if (studentIds.length === 0) {
    return { error: "Select at least one student to reassign." };
  }

  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("student_profiles")
    .update({ assigned_counsellor_id: toCounsellorId })
    .in("user_id", studentIds);
  if (profileError) return { error: profileError.message };

  // Replace each student's caseload row (unique on counsellor_id+student_id),
  // carrying reassigned_from as the handoff-history marker (CLAUDE.md §5 Stage 6
  // exit criteria).
  await supabase.from("counsellor_caseloads").delete().in("student_id", studentIds);
  const { error: caseloadError } = await supabase.from("counsellor_caseloads").insert(
    studentIds.map((studentId) => ({
      counsellor_id: toCounsellorId,
      student_id: studentId,
      reassigned_from: fromCounsellorId,
    })),
  );
  if (caseloadError) return { error: caseloadError.message };

  // Caseload counts (the Team view's bars) update immediately on the next
  // render. The handoff snapshot is generated in the background per student —
  // never blocks the reassignment response, matching the non-blocking AI
  // pattern used for risk detection / signal extraction elsewhere.
  after(async () => {
    for (const studentId of studentIds) {
      try {
        await generateAndStoreHandoff(studentId, toCounsellorId);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { ai_feature: "reassignment_snapshot" },
        });
      }
    }
  });

  revalidatePath("/counsellor/team");
  for (const studentId of studentIds) {
    revalidatePath(`/counsellor/students/${studentId}`);
  }

  return { reassignedAt: Date.now() };
}
