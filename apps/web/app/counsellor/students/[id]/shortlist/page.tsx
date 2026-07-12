import { Card } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import {
  ShortlistStatusPill,
  CategoryPill,
  type ShortlistStatus,
  type ShortlistCategory,
} from "@/lib/status-display";
import { AddUniversityDialog } from "@/components/counsellor/add-university-dialog";
import { ShortlistEntryControls } from "@/components/counsellor/shortlist-entry-controls";

type Entry = {
  id: string;
  university_name: string;
  course: string | null;
  country: string | null;
  deadline: string | null;
  category: ShortlistCategory | null;
  status: ShortlistStatus;
  student_note: string | null;
};
type Priorities = {
  top_priority: string | null;
  location_pref: string | null;
  financial_aid_needed: boolean;
  culture_pref: string | null;
};

function metaLine(e: Entry): string {
  return [
    e.course,
    e.country,
    e.deadline
      ? new Date(e.deadline).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default async function StudentShortlistTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: entryRows }, { data: pri }, { data: apps }] = await Promise.all([
    supabase
      .from("shortlist_entries")
      .select(
        "id, university_name, course, country, deadline, category, status, student_note",
      )
      .eq("student_id", id)
      .order("university_name"),
    supabase
      .from("student_priorities")
      .select("top_priority, location_pref, financial_aid_needed, culture_pref")
      .eq("student_id", id)
      .maybeSingle(),
    supabase
      .from("applications")
      .select("shortlist_entry_id")
      .eq("student_id", id),
  ]);

  const entries = (entryRows as Entry[]) ?? [];
  const priorities = (pri as Priorities | null) ?? null;
  const convertedIds = new Set(
    (apps ?? [])
      .map((a) => a.shortlist_entry_id as string | null)
      .filter((x): x is string => Boolean(x)),
  );

  const priLine = priorities
    ? [
        priorities.top_priority
          ? `Priority: ${priorities.top_priority}`
          : null,
        priorities.location_pref ? `Location: ${priorities.location_pref}` : null,
        priorities.financial_aid_needed ? "Financial aid needed" : null,
        priorities.culture_pref ? `Culture: ${priorities.culture_pref}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddUniversityDialog studentId={id} />
      </div>

      {priLine ? (
        <Card>
          <h2 className="text-sm font-bold text-ink">
            What this student wants out of their list
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">{priLine}</p>
          <p className="mt-2 text-xs text-ink-tertiary">
            Set by the student — informational only. Every reach/target/safety
            call is still yours.
          </p>
        </Card>
      ) : null}

      {entries.length === 0 ? (
        <p className="text-sm text-ink-tertiary">
          No universities yet. Add one, or wait for the student to suggest one.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((e) => (
            <li key={e.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-ink">
                      {e.university_name}
                    </p>
                    {metaLine(e) ? (
                      <p className="mt-0.5 text-sm text-ink-secondary">
                        {metaLine(e)}
                      </p>
                    ) : null}
                    {e.student_note ? (
                      <p className="mt-2 text-sm text-ink-secondary">
                        <span className="font-semibold text-ink">
                          Student note:
                        </span>{" "}
                        &ldquo;{e.student_note}&rdquo;
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {e.category ? <CategoryPill category={e.category} /> : null}
                    <ShortlistStatusPill
                      status={e.status}
                      converted={convertedIds.has(e.id)}
                    />
                  </div>
                </div>

                <div className="mt-4 border-t border-border-soft pt-3">
                  <ShortlistEntryControls
                    studentId={id}
                    entryId={e.id}
                    status={e.status}
                    category={e.category}
                    converted={convertedIds.has(e.id)}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
