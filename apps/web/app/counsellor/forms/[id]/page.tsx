import { notFound } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/lib/actions/forms";

type Form = { id: string; title: string; source: string; questions: Question[] | null; external_form_id: string | null };
type Assignment = { student_id: string; status: string };
type Response = { student_id: string; answers: Record<string, string>; submitted_at: string };

// UC10 Screen 4: aggregate tally per question + individual responses (native
// forms). Microsoft/Google-embedded forms have no structured answers to
// aggregate — only assignment status is shown (see createEmbedForm's note).
export default async function FormResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, title, source, questions, external_form_id")
    .eq("id", id)
    .maybeSingle();
  if (!form) notFound();
  const f = form as Form;

  const [{ data: assignments }, { data: responses }] = await Promise.all([
    supabase.from("form_assignments").select("student_id, status").eq("form_id", id),
    supabase.from("form_responses").select("student_id, answers, submitted_at").eq("form_id", id),
  ]);

  const studentIds = (assignments as Assignment[] | null)?.map((a) => a.student_id) ?? [];
  const { data: users } = studentIds.length
    ? await supabase.from("users").select("id, full_name, email").in("id", studentIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };
  const nameById = new Map((users ?? []).map((u) => [u.id, u.full_name ?? u.email]));

  const assignmentRows = (assignments as Assignment[]) ?? [];
  const responseRows = (responses as Response[]) ?? [];
  const respondedCount = assignmentRows.filter((a) => a.status === "responded").length;

  const questions = f.questions ?? [];
  const tally = questions.map((q, i) => {
    const counts = new Map<string, number>();
    for (const r of responseRows) {
      const ans = r.answers?.[String(i)];
      if (ans) counts.set(ans, (counts.get(ans) ?? 0) + 1);
    }
    return { question: q, counts };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
          Forms
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{f.title}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {respondedCount} of {assignmentRows.length} responded
        </p>
      </div>

      {f.source !== "native" ? (
        <Card>
          <CardHeader>
            <CardTitle>Assignment status</CardTitle>
            <CardDescription>
              {f.source === "microsoft_forms" ? "Microsoft Forms" : "Google Forms"} embed.
              Responses are collected there, not in Epicenter. Students confirm
              completion manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {assignmentRows.map((a) => (
                <li key={a.student_id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{nameById.get(a.student_id) ?? "Unnamed student"}</span>
                  <span className={a.status === "responded" ? "text-complete-ink" : "text-ink-tertiary"}>
                    {a.status === "responded" ? "Complete" : "Sent"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Question tally</CardTitle>
              <CardDescription>Aggregate answers.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {tally.map(({ question, counts }, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-ink">{question.prompt}</p>
                  {counts.size ? (
                    <p className="text-sm text-ink-secondary">
                      {Array.from(counts.entries())
                        .map(([opt, n]) => `${opt}: ${n}`)
                        .join(" · ")}
                    </p>
                  ) : (
                    <p className="text-sm text-ink-tertiary">No answers yet.</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Individual Responses</CardTitle>
              <CardDescription>By student.</CardDescription>
            </CardHeader>
            <CardContent>
              {responseRows.length ? (
                <ul className="flex flex-col gap-3">
                  {responseRows.map((r) => (
                    <li key={r.student_id} className="text-sm">
                      <span className="font-semibold text-ink">
                        {nameById.get(r.student_id) ?? "Unnamed student"}
                      </span>
                      <ul className="mt-1 flex flex-col gap-0.5 text-ink-secondary">
                        {questions.map((q, i) => (
                          <li key={i}>
                            {q.prompt}: &ldquo;{r.answers?.[String(i)] ?? "-"}&rdquo;
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-tertiary">No responses yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
