import { Card } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import {
  ShortlistStatusPill,
  CategoryPill,
  type ShortlistStatus,
  type ShortlistCategory,
} from "@/lib/status-display";
import { SuggestUniversityDialog } from "@/components/student/suggest-university-dialog";
import { PrioritiesForm } from "@/components/student/priorities-form";

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

export default async function StudentShortlistPage() {
  const supabase = await createClient();

  const [{ data: entryRows }, { data: pri }, { data: apps }] = await Promise.all([
    supabase
      .from("shortlist_entries")
      .select(
        "id, university_name, course, country, deadline, category, status, student_note",
      )
      .order("university_name"),
    supabase
      .from("student_priorities")
      .select("top_priority, location_pref, financial_aid_needed, culture_pref")
      .maybeSingle(),
    supabase.from("applications").select("shortlist_entry_id"),
  ]);

  const entries = (entryRows as Entry[]) ?? [];
  const priorities = (pri as Priorities | null) ?? null;
  const convertedIds = new Set(
    (apps ?? [])
      .map((a) => a.shortlist_entry_id as string | null)
      .filter((x): x is string => Boolean(x)),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
            College Shortlist
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
            College Shortlist
          </h1>
        </div>
        <SuggestUniversityDialog />
      </div>

      {entries.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-secondary">
            No universities yet. Suggest one and your counsellor will review it.
          </p>
        </Card>
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
                          Your note:
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
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <h2 className="text-base font-bold text-ink">
          What do I want out of my list?
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          A preferences worksheet for your counsellor — this is never used to
          auto-match universities.
        </p>
        <div className="mt-4">
          <PrioritiesForm priorities={priorities} />
        </div>
      </Card>
    </div>
  );
}
