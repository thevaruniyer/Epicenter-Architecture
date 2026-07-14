import { Suspense } from "react";
import { Skeleton } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import { StudentsGrid, type StudentSummary } from "@/components/counsellor/students-grid";

// Students grid (UC1 Screens 2–3). RLS-scoped: a counsellor sees only their own
// caseload; head of counselling sees across caseloads.
type ProfileRow = {
  user_id: string;
  grade: number | null;
  intended_major: string | null;
  users: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
};

async function StudentsGridData() {
  const supabase = await createClient();

  // Single embedded-select instead of student_profiles then a dependent
  // users-by-id lookup — was a real two-round-trip waterfall (the second
  // query can only start once the first resolves), now one request.
  const { data: profiles } = await supabase
    .from("student_profiles")
    .select("user_id, grade, intended_major, users:user_id(full_name, email)");

  const rows = (profiles as ProfileRow[]) ?? [];

  const students: StudentSummary[] = rows
    .map((p) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users;
      return {
        id: p.user_id,
        name: u?.full_name ?? u?.email ?? "Unnamed student",
        grade: p.grade,
        major: p.intended_major,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return <StudentsGrid students={students} />;
}

// Suspense scoped inside this page (not a route-segment loading.tsx): a
// loading.tsx here would sit at the `students/` segment and wrap every
// nested `[id]/*` route too (roadmap, notes, applications, shortlist...),
// which broke tick-then-confirm/shortlist/applications/notes/reassignment —
// a Suspense boundary local to this component's own render tree can't leak
// into sibling dynamic routes the way the file-based convention does.
export default function CounsellorStudentsPage() {
  return (
    <Suspense fallback={<StudentsGridSkeleton />}>
      <StudentsGridData />
    </Suspense>
  );
}

function StudentsGridSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li
            key={i}
            className="flex h-32 flex-col justify-between rounded-lg border border-border-soft bg-surface-raised p-5 shadow-glass"
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
