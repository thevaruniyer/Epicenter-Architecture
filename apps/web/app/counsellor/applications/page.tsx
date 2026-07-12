import Link from "next/link";
import { Card } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import {
  ApplicationStatusPill,
  type ApplicationStatus,
  type Decision,
} from "@/lib/status-display";

type Row = {
  id: string;
  student_id: string;
  status: ApplicationStatus;
  decision: Decision | null;
  users: { full_name: string | null; email: string | null } | null;
  shortlist_entries: {
    university_name: string;
    course: string | null;
    deadline: string | null;
  } | null;
};

function fmt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// UC5 Screen 3: the cross-caseload view a counsellor lives in during application
// season. RLS scopes it to their own students automatically.
export default async function CounsellorApplicationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "id, student_id, status, decision, users:student_id(full_name, email), shortlist_entries(university_name, course, deadline)",
    );
  const rows = (data as Row[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Applications Centre
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Every live application across your caseload.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-secondary">
            No live applications yet. Convert an approved shortlist entry to get
            started.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const name = r.users?.full_name ?? r.users?.email ?? "Student";
            const uni = r.shortlist_entries;
            const meta = [
              uni?.course,
              fmt(uni?.deadline ?? null)
                ? `Deadline ${fmt(uni?.deadline ?? null)}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={r.id}>
                <Link
                  href={`/counsellor/students/${r.student_id}/applications`}
                  className="block rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
                >
                  <Card className="hover:bg-surface-muted">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-ink">
                          {name} — {uni?.university_name ?? "University"}
                        </p>
                        {meta ? (
                          <p className="mt-0.5 text-sm text-ink-secondary">
                            {meta}
                          </p>
                        ) : null}
                      </div>
                      <ApplicationStatusPill
                        status={r.status}
                        decision={r.decision}
                      />
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
