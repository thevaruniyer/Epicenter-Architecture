import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card, buttonVariants } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import { CreateFormDialog } from "@/components/counsellor/create-form-dialog";

type FormRow = { id: string; title: string; source: string };
type AssignmentRow = { form_id: string; status: string };

// UC10 Screen 1: Forms list, per-form response tally.
export default async function CounsellorFormsPage() {
  const supabase = await createClient();

  const [{ data: forms }, { data: assignments }, { data: profiles }] = await Promise.all([
    supabase.from("forms").select("id, title, source").order("id", { ascending: false }),
    supabase.from("form_assignments").select("form_id, status"),
    supabase.from("student_profiles").select("user_id, grade"),
  ]);

  const studentIds = (profiles ?? []).map((p) => p.user_id as string);
  const { data: users } = studentIds.length
    ? await supabase.from("users").select("id, full_name, email").in("id", studentIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };
  const nameById = new Map(
    (users ?? []).map((u) => [u.id, u.full_name ?? u.email]),
  );
  const students = (profiles ?? []).map((p) => ({
    id: p.user_id as string,
    grade: p.grade as number | null,
    name: nameById.get(p.user_id as string) ?? "Unnamed student",
  }));

  const tallyByForm = new Map<string, { sent: number; responded: number }>();
  for (const a of (assignments as AssignmentRow[]) ?? []) {
    const t = tallyByForm.get(a.form_id) ?? { sent: 0, responded: 0 };
    t.sent += 1;
    if (a.status === "responded") t.responded += 1;
    tallyByForm.set(a.form_id, t);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
            Forms
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Forms</h1>
        </div>
        <CreateFormDialog students={students} />
      </div>

      {!forms || forms.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-surface-muted text-ink">
            <ClipboardList className="size-6" aria-hidden />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-ink">
            No forms yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
            Create a form to collect information from your students.
          </p>
        </Card>
      ) : (
        <Card>
          <ul className="flex flex-col divide-y divide-border-soft">
            {(forms as FormRow[]).map((f) => {
              const t = tallyByForm.get(f.id) ?? { sent: 0, responded: 0 };
              const closed = t.sent > 0 && t.responded === t.sent;
              return (
                <li key={f.id} className="flex items-center gap-4 px-2 py-3">
                  <ClipboardList className="size-5 shrink-0 text-ink-tertiary" aria-hidden />
                  <div className="flex-1">
                    <Link
                      href={`/counsellor/forms/${f.id}`}
                      className="text-sm font-semibold text-ink hover:underline"
                    >
                      {f.title}
                    </Link>
                    <p className="text-xs text-ink-tertiary">
                      {f.source === "native" ? "Native" : f.source === "microsoft_forms" ? "Microsoft Forms" : "Google Forms"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink-secondary">
                    {closed ? "Closed" : `${t.responded} / ${t.sent} responded`}
                  </span>
                  <Link
                    href={`/counsellor/forms/${f.id}`}
                    className={buttonVariants({ variant: "tertiary", size: "sm" })}
                  >
                    View
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
