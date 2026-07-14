import Link from "next/link";
import { Clock } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@epicenter/ui";
import { getDigest } from "@/lib/digest";
import { DigestCard } from "@/components/counsellor/digest-card";
import { AttentionListCard, type AttentionItem } from "@/components/counsellor/attention-list-card";

function firstName(email: string | null): string {
  if (!email) return "there";
  const handle = email.split("@")[0] ?? "";
  const name = handle.split(/[._-]/)[0] ?? handle;
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "there";
}

function studentName(row: { users?: { full_name: string | null } | null } | null): string {
  return row?.users?.full_name ?? "Unnamed student";
}

type NamedRow = { student_id: string; users?: { full_name: string | null } | null };

// UC1 Screen 1 — rebuilt against UI Ref 1/2 Dashboard.jpg's composition
// (stat tiles + list widgets + spacious hierarchy) but re-skinned entirely in
// Doctrine tokens, and against Doctrine §15.3/§20's own dashboard hierarchy —
// today's schedule, students needing attention, overdue work, awaiting
// review, then a plain-numeric progress overview. No decorative charts
// (§20.2), no invented colours — every list item is a real record that
// deep-links to it (§15.4), and every tile uses the existing semantic tokens.
export default async function CounsellorDashboardPage() {
  const user = await getSessionUser();
  const supabase = await createClient();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  ).toISOString();

  const [
    digest,
    { data: meetingsToday },
    { data: riskRows },
    { data: stalledRows },
    { data: overdueRows },
    { data: pendingTasks },
    { data: submittedReqs },
    { data: suggestions },
    { count: totalTasks },
    { count: completeTasks },
  ] = await Promise.all([
    user ? getDigest(user.id) : Promise.resolve([] as string[]),
    supabase
      .from("calendar_events")
      .select("id, title, starts_at, student_id, users:student_id(full_name)")
      .eq("counsellor_id", user!.id)
      .gte("starts_at", startOfToday)
      .lt("starts_at", startOfTomorrow)
      .order("starts_at", { ascending: true }),
    supabase
      .from("risk_flags")
      .select("id, student_id, type, users:student_id(full_name)")
      .is("dismissed_at", null),
    supabase
      .from("stalled_task_alerts")
      .select("id, tasks!inner(student_id, users:student_id(full_name))")
      .is("dismissed_at", null),
    supabase
      .from("tasks")
      .select("id, title, due_date, student_id, users:student_id(full_name)")
      .lt("due_date", todayStr)
      .neq("status", "complete")
      .order("due_date", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, student_id, users:student_id(full_name)")
      .eq("status", "pending_review"),
    supabase
      .from("application_requirements")
      .select("id, title, application_id, applications:application_id(student_id, users:student_id(full_name))")
      .eq("status", "submitted_awaiting_confirmation"),
    supabase
      .from("shortlist_entries")
      .select("id, university_name, student_id, users:student_id(full_name)")
      .eq("status", "awaiting_review")
      .eq("suggested_by", "student"),
    supabase.from("tasks").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "complete"),
  ]);

  // "Requires attention" — undismissed risk + stalled signals, deduped per
  // student (a student can carry both) with reasons combined into one row.
  const attentionByStudent = new Map<string, { name: string; reasons: string[] }>();
  for (const r of (riskRows as
    | { id: string; student_id: string; type: string; users?: { full_name: string | null } | null }[]
    | null) ?? []) {
    const entry = attentionByStudent.get(r.student_id) ?? { name: studentName(r), reasons: [] };
    entry.reasons.push(r.type === "grade_drop" ? "Grade risk" : "Pace risk");
    attentionByStudent.set(r.student_id, entry);
  }
  for (const r of (stalledRows as
    | { id: string; tasks: { student_id: string; users?: { full_name: string | null } | null } }[]
    | null) ?? []) {
    const sid = r.tasks.student_id;
    const entry = attentionByStudent.get(sid) ?? { name: studentName(r.tasks), reasons: [] };
    entry.reasons.push("Stalled task");
    attentionByStudent.set(sid, entry);
  }
  const attentionItems: AttentionItem[] = Array.from(attentionByStudent.entries()).map(
    ([studentId, v]) => ({
      id: studentId,
      label: v.name,
      meta: v.reasons.join(" · "),
      href: `/counsellor/students/${studentId}`,
    }),
  );

  const overdueItems: AttentionItem[] = ((overdueRows as
    | { id: string; title: string; due_date: string; student_id: string; users?: { full_name: string | null } | null }[]
    | null) ?? []).map((t) => {
    // Calendar-day diff, not wall-clock ms — due_date is a date with no
    // time-of-day, so comparing it to Date.now() drifts by up to a day
    // depending what time it is right now.
    const days = Math.round(
      (new Date(todayStr).getTime() - new Date(t.due_date).getTime()) / 86_400_000,
    );
    return {
      id: t.id,
      label: `${studentName(t)} — ${t.title}`,
      meta: `${days} day${days === 1 ? "" : "s"} overdue`,
      href: `/counsellor/students/${t.student_id}/roadmap`,
    };
  });

  const awaitingItems: AttentionItem[] = [
    ...((pendingTasks as (NamedRow & { id: string; title: string })[] | null) ?? []).map((t) => ({
      id: `task-${t.id}`,
      label: `${studentName(t)} — ${t.title}`,
      meta: "Task",
      href: `/counsellor/students/${t.student_id}/roadmap`,
    })),
    ...((submittedReqs as
      | { id: string; title: string; applications: { student_id: string; users?: { full_name: string | null } | null } }[]
      | null) ?? []).map((r) => ({
      id: `req-${r.id}`,
      label: `${studentName(r.applications)} — ${r.title}`,
      meta: "Requirement",
      href: `/counsellor/students/${r.applications.student_id}/applications`,
    })),
    ...((suggestions as
      | { id: string; university_name: string; student_id: string; users?: { full_name: string | null } | null }[]
      | null) ?? []).map((s) => ({
      id: `suggestion-${s.id}`,
      label: `${studentName(s)} — ${s.university_name}`,
      meta: "Shortlist",
      href: `/counsellor/students/${s.student_id}/shortlist`,
    })),
  ];

  const meetingItems = (meetingsToday as
    | { id: string; title: string; starts_at: string; student_id: string | null; users?: { full_name: string | null } | null }[]
    | null) ?? [];

  const progressPct = totalTasks ? Math.round(((completeTasks ?? 0) / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Good day, {firstName(user?.email ?? null)}
        </h1>
      </div>

      <DigestCard lines={digest} />

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Today</h2>
          <p className="text-xs text-ink-tertiary">
            {meetingItems.length} counselling{" "}
            {meetingItems.length === 1 ? "meeting" : "meetings"}
          </p>
        </div>
        {meetingItems.length === 0 ? (
          <p className="mt-3 text-sm text-ink-tertiary">No meetings scheduled today.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border-soft">
            {meetingItems.map((m) => (
              <li key={m.id}>
                <Link
                  href="/counsellor/calendar"
                  className="-mx-1 flex items-center gap-3 rounded-md px-1 py-2 text-sm transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
                >
                  <Clock className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                  <span className="w-16 shrink-0 font-semibold text-ink">
                    {new Date(m.starts_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-ink">{studentName(m) !== "Unnamed student" ? studentName(m) : m.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <AttentionListCard
          title="Requires attention"
          description="Prioritised by risk and stalled progress."
          tone="overdue"
          items={attentionItems}
          emptyLabel="No students currently flagged."
        />
        <AttentionListCard
          title="Overdue"
          description="Owner and how overdue, before you open it."
          tone="overdue"
          items={overdueItems}
          emptyLabel="Nothing overdue."
        />
        <AttentionListCard
          title="Awaiting your review"
          description="Open the exact task, requirement, or suggestion."
          tone="pending"
          items={awaitingItems}
          emptyLabel="Nothing waiting on you."
        />
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Caseload progress</h2>
        <p className="text-xs text-ink-tertiary">
          Roadmap tasks complete across your caseload — no vanity metric, just the count.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <p className="text-3xl font-bold tracking-tight text-ink">{progressPct}%</p>
          <div className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-muted">
            <div
              className="h-full rounded-pill bg-yellow"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-secondary">
          {completeTasks ?? 0} of {totalTasks ?? 0} tasks complete
        </p>
      </Card>
    </div>
  );
}
