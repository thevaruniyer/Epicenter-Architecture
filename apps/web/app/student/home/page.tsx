import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import {
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@epicenter/ui";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TodoPanel, type MeetingItem } from "@/components/student/todo-panel";
import type { Question } from "@/lib/actions/forms";

type Task = { id: string; title: string; status: string; due_date: string | null };
type Note = { id: string; final_text: string | null; created_at: string };
type FormAssignment = { form_id: string; status: string };
type FormRow = {
  id: string;
  title: string;
  source: string;
  questions: Question[] | null;
  external_form_id: string | null;
};
type MeetingRow = { id: string; title: string; starts_at: string | null };

function firstName(full: string | null): string {
  if (!full) return "there";
  return full.split(" ")[0] ?? full;
}

export default async function StudentHomePage() {
  const user = await getSessionUser();
  const supabase = await createClient();

  const [{ data: userRow }, { data: profile }, { data: taskRows }, { data: noteRows }, { data: shortlist }, { data: assignmentRows }, { data: meetingRows }] =
    await Promise.all([
      supabase.from("users").select("full_name").eq("id", user!.id).maybeSingle(),
      supabase
        .from("student_profiles")
        .select("onboarding_completed_at")
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase.from("tasks").select("id, title, status, due_date"),
      supabase
        .from("notes")
        .select("id, final_text, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase.from("shortlist_entries").select("id"),
      supabase.from("form_assignments").select("form_id, status").eq("student_id", user!.id),
      supabase
        .from("calendar_events")
        .select("id, title, starts_at")
        .eq("student_id", user!.id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(1),
    ]);

  const name = firstName(userRow?.full_name ?? null);
  const onboardingDone = Boolean(profile?.onboarding_completed_at);
  const tasks = (taskRows as Task[]) ?? [];
  const notes = (noteRows as Note[]) ?? [];
  const shortlistCount = (shortlist ?? []).length;
  const assignments = (assignmentRows as FormAssignment[]) ?? [];
  const established = tasks.length > 0 || notes.length > 0 || shortlistCount > 0;

  const completed = tasks.filter((t) => t.status === "complete").length;
  const nextTask = tasks.find((t) => t.status !== "complete");

  // Calendar-aware: only a real upcoming calendar_events row for this student
  // becomes a Meeting card — no meeting, no card.
  const nextMeetingRow = ((meetingRows as MeetingRow[]) ?? [])[0];
  const meeting: MeetingItem | null =
    nextMeetingRow && nextMeetingRow.starts_at
      ? { id: nextMeetingRow.id, title: nextMeetingRow.title, startsAt: nextMeetingRow.starts_at }
      : null;

  // SU8: forms sit alongside tasks in one To Do list — tasks always show
  // (roadmap data), forms only once a real one has been assigned.
  let todoItems: Parameters<typeof TodoPanel>[0]["items"] = tasks
    .filter((t) => t.status !== "complete")
    .map((t) => ({ kind: "task" as const, id: t.id, title: t.title, due: t.due_date }));
  if (assignments.length > 0) {
    const formIds = assignments.map((a) => a.form_id);
    const { data: forms } = await supabase
      .from("forms")
      .select("id, title, source, questions, external_form_id")
      .in("id", formIds);
    const formById = new Map((forms as FormRow[] | null)?.map((f) => [f.id, f]) ?? []);
    todoItems = [
      ...todoItems,
      ...assignments
        .map((a) => {
          const f = formById.get(a.form_id);
          if (!f) return null;
          return {
            kind: "form" as const,
            id: f.id,
            title: f.title,
            source: f.source,
            questions: f.questions,
            external_form_id: f.external_form_id,
            status: a.status,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
          Home
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Hi {name}
        </h1>
      </div>

      {!onboardingDone ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-reach-border bg-reach-bg p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-0.5 size-5 shrink-0 text-reach-ink" aria-hidden />
            <div>
              <p className="font-semibold text-reach-ink">
                Finish setting up your profile
              </p>
              <p className="text-sm text-reach-ink/80">
                You skipped onboarding — pick up where you left off.
              </p>
            </div>
          </div>
          <Link href="/onboarding" className={buttonVariants({ size: "sm" })}>
            Resume
          </Link>
        </div>
      ) : null}

      {/* SU1 Screen 10: the To Do panel is the dashboard grid's right-hand
          column in every variant (sparse or established), not a separate
          full-width block. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {!established ? (
          <Card className="text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-lg bg-surface-muted text-ink">
              <ClipboardList className="size-6" aria-hidden />
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-ink">
              Your journey starts here
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
              Once your counsellor sets up your roadmap and shares notes, they&rsquo;ll
              appear here. In the meantime, keep your profile up to date.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your roadmap</CardTitle>
                <CardDescription>
                  {completed} of {tasks.length} tasks complete
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="h-2 overflow-hidden rounded-pill bg-surface-muted">
                  <div
                    className="h-full rounded-pill bg-yellow"
                    style={{
                      width: `${tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%`,
                    }}
                  />
                </div>
                {nextTask ? (
                  <p className="text-sm text-ink-secondary">
                    Next: <span className="font-medium text-ink">{nextTask.title}</span>
                  </p>
                ) : (
                  <p className="text-sm text-ink-secondary">All caught up 🎉</p>
                )}
                <Link
                  href="/student/roadmap"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline"
                >
                  Open roadmap <ArrowRight className="size-4" aria-hidden />
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent notes</CardTitle>
                <CardDescription>Shared by your counsellor.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {notes.length ? (
                  notes.map((n) => (
                    <p key={n.id} className="line-clamp-2 text-sm text-ink">
                      {n.final_text}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-ink-tertiary">No shared notes yet.</p>
                )}
                <Link
                  href="/student/notes"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline"
                >
                  All notes <ArrowRight className="size-4" aria-hidden />
                </Link>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2">
              <CardHeader>
                <CardTitle>Your shortlist</CardTitle>
                <CardDescription>Universities you&rsquo;re considering.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-2xl font-bold text-ink">{shortlistCount}</p>
                <Link
                  href="/student/shortlist"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline"
                >
                  Open shortlist <ArrowRight className="size-4" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="lg:sticky lg:top-4 lg:self-start">
          <TodoPanel items={todoItems} meeting={meeting} />
        </div>
      </div>
    </div>
  );
}
