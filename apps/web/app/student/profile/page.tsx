import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@epicenter/ui";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditProfileDialog } from "@/components/counsellor/edit-profile-dialog";

type Extracurricular = { activity?: string; role?: string; duration?: string };
type Profile = {
  grade: number | null;
  age: number | null;
  intended_major: string | null;
  career_interest: string | null;
  subjects: string[] | null;
  hobbies: string[] | null;
  preferred_countries: string[] | null;
  extracurriculars: Extracurricular[] | null;
  test_scores: Record<string, string | number> | null;
};

export default async function StudentProfilePage() {
  const user = await getSessionUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select(
      "grade, age, intended_major, career_interest, subjects, hobbies, preferred_countries, extracurriculars, test_scores",
    )
    .eq("user_id", user!.id)
    .maybeSingle();

  const p = (data as Profile) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
            My Profile
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
            My Profile
          </h1>
        </div>
        <EditProfileDialog
          studentId={user!.id}
          intendedMajor={p?.intended_major ?? ""}
          careerInterest={p?.career_interest ?? ""}
          preferredCountries={(p?.preferred_countries ?? []).join(", ")}
        />
      </div>

      {/* Major / EC list are pre-filled from onboarding. AI badges land in Phase 5. */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Direction and destinations.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Field label="Intended major" value={p?.intended_major ?? null} />
            <Field label="Career interest" value={p?.career_interest ?? null} />
            <Field
              label="Preferred countries"
              value={(p?.preferred_countries ?? []).join(", ") || null}
            />
            <Field label="Grade" value={p?.grade ? `Grade ${p.grade}` : null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracurriculars &amp; achievements</CardTitle>
            <CardDescription>From your onboarding.</CardDescription>
          </CardHeader>
          <CardContent>
            {p?.extracurriculars?.length ? (
              <ul className="flex flex-col gap-2">
                {p.extracurriculars.map((ec, i) => (
                  <li key={i} className="text-sm text-ink">
                    <span className="font-semibold">{ec.activity}</span>
                    {ec.role ? (
                      <span className="text-ink-secondary"> — {ec.role}</span>
                    ) : null}
                    {ec.duration ? (
                      <span className="text-ink-secondary"> · {ec.duration}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-tertiary">Nothing added yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academics</CardTitle>
            <CardDescription>Subjects and scores.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="Subjects" value={(p?.subjects ?? []).join(", ") || null} />
            <div className="flex flex-wrap gap-2">
              {Object.entries(p?.test_scores ?? {}).length ? (
                Object.entries(p!.test_scores!).map(([k, v]) => (
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>Hobbies and interests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Hobbies" value={(p?.hobbies ?? []).join(", ") || null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">
        {label}
      </span>
      <span className="text-sm text-ink">
        {value ?? <span className="text-ink-secondary">Not set</span>}
      </span>
    </div>
  );
}
