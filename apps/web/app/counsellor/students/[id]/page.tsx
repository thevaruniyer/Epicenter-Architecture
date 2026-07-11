import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import { EditProfileDialog } from "@/components/counsellor/edit-profile-dialog";

type Extracurricular = { activity?: string; role?: string; duration?: string };

type Profile = {
  grade: number | null;
  age: number | null;
  intended_major: string | null;
  career_interest: string | null;
  subjects: string[];
  hobbies: string[];
  preferred_countries: string[];
  extracurriculars: Extracurricular[];
  test_scores: Record<string, string | number>;
};

function completion(p: Profile): number {
  const checks = [
    Boolean(p.intended_major),
    Boolean(p.career_interest),
    p.preferred_countries.length > 0,
    Object.keys(p.test_scores).length > 0,
    p.extracurriculars.length > 0,
    p.subjects.length > 0,
    p.hobbies.length > 0,
    Boolean(p.age),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default async function StudentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select(
      "grade, age, intended_major, career_interest, subjects, hobbies, preferred_countries, extracurriculars, test_scores",
    )
    .eq("user_id", id)
    .maybeSingle();

  const p: Profile = {
    grade: data?.grade ?? null,
    age: data?.age ?? null,
    intended_major: data?.intended_major ?? null,
    career_interest: data?.career_interest ?? null,
    subjects: (data?.subjects as string[]) ?? [],
    hobbies: (data?.hobbies as string[]) ?? [],
    preferred_countries: (data?.preferred_countries as string[]) ?? [],
    extracurriculars: (data?.extracurriculars as Extracurricular[]) ?? [],
    test_scores: (data?.test_scores as Record<string, string | number>) ?? {},
  };

  const pct = completion(p);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-secondary">Profile completion</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-ink">
              {pct}%
            </p>
          </div>
          <EditProfileDialog
            studentId={id}
            intendedMajor={p.intended_major ?? ""}
            careerInterest={p.career_interest ?? ""}
            preferredCountries={p.preferred_countries.join(", ")}
          />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-pill bg-surface-muted">
          <div className="h-full rounded-pill bg-yellow" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Direction and destinations.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Field label="Intended major" value={p.intended_major} />
            <Field label="Career interest" value={p.career_interest} />
            <Field
              label="Preferred countries"
              value={p.preferred_countries.join(", ") || null}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracurriculars &amp; achievements</CardTitle>
            <CardDescription>Activities, roles, and duration.</CardDescription>
          </CardHeader>
          <CardContent>
            {p.extracurriculars.length ? (
              <ul className="flex flex-col gap-2">
                {p.extracurriculars.map((ec, i) => (
                  <li key={i} className="text-sm text-ink">
                    <span className="font-semibold">{ec.activity}</span>
                    {ec.role ? (
                      <span className="text-ink-secondary"> — {ec.role}</span>
                    ) : null}
                    {ec.duration ? (
                      <span className="text-ink-tertiary"> · {ec.duration}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-tertiary">Nothing recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test scores &amp; academic history</CardTitle>
            <CardDescription>Scores and subjects.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(p.test_scores).length ? (
                Object.entries(p.test_scores).map(([k, v]) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 rounded-pill border border-border-strong bg-surface-muted px-3 py-1 text-xs font-semibold text-ink"
                  >
                    {k}: {String(v)}
                  </span>
                ))
              ) : (
                <span className="text-sm text-ink-tertiary">No scores yet.</span>
              )}
            </div>
            <Field label="Subjects" value={p.subjects.join(", ") || null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>Hobbies and interests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Hobbies" value={p.hobbies.join(", ") || null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
        {label}
      </span>
      <span className="text-sm text-ink">
        {value ?? <span className="text-ink-tertiary">Not set</span>}
      </span>
    </div>
  );
}
