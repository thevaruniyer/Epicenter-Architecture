import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TeamView, type CounsellorLoad } from "@/components/counsellor/team-view";

// UC6: Head of Counselling's Team view — caseload bars per counsellor, plus
// the reassignment flow. Role-gated: a regular counsellor never sees this
// route (redirected to their own dashboard).
export default async function CounsellorTeamPage() {
  const user = await getSessionUser();
  if (user?.role !== "head_of_counselling") redirect("/counsellor/dashboard");

  const supabase = await createClient();

  const { data: counsellors } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("role", ["counsellor", "head_of_counselling"])
    .order("full_name", { ascending: true });

  const { data: profiles } = await supabase
    .from("student_profiles")
    .select("user_id, assigned_counsellor_id");

  const { data: students } = await supabase.from("users").select("id, full_name, email");
  const studentNameById = new Map(
    (students ?? []).map((s) => [s.id, s.full_name ?? s.email]),
  );

  const counts = new Map<string, string[]>();
  for (const p of profiles ?? []) {
    if (!p.assigned_counsellor_id) continue;
    const list = counts.get(p.assigned_counsellor_id) ?? [];
    list.push(p.user_id);
    counts.set(p.assigned_counsellor_id, list);
  }

  const loads: CounsellorLoad[] = (counsellors ?? []).map((c) => {
    const studentIds = counts.get(c.id) ?? [];
    return {
      id: c.id,
      name: c.full_name ?? c.email,
      studentIds,
      students: studentIds.map((id) => ({
        id,
        name: studentNameById.get(id) ?? "Unnamed student",
      })),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
          Team
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Team</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Caseload across every counsellor. Select a counsellor to reassign
          their students.
        </p>
      </div>

      <TeamView loads={loads} />
    </div>
  );
}
