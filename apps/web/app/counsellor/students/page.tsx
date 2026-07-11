import { createClient } from "@/lib/supabase/server";
import { StudentsGrid, type StudentSummary } from "@/components/counsellor/students-grid";

// Students grid (UC1 Screens 2–3). RLS-scoped: a counsellor sees only their own
// caseload; head of counselling sees across caseloads.
export default async function CounsellorStudentsPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("student_profiles")
    .select("user_id, grade, intended_major");

  const rows = profiles ?? [];
  const ids = rows.map((p: { user_id: string }) => p.user_id);

  const { data: users } = ids.length
    ? await supabase.from("users").select("id, full_name, email").in("id", ids)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const nameById = new Map(
    (users ?? []).map((u: { id: string; full_name: string | null; email: string }) => [
      u.id,
      u.full_name ?? u.email,
    ]),
  );

  const students: StudentSummary[] = rows
    .map((p: { user_id: string; grade: number | null; intended_major: string | null }) => ({
      id: p.user_id,
      name: nameById.get(p.user_id) ?? "Unnamed student",
      grade: p.grade,
      major: p.intended_major,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <StudentsGrid students={students} />;
}
