import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { CalendarView, type CalendarEvent } from "@/components/counsellor/calendar-view";

type EventRow = { id: string; title: string; starts_at: string; ends_at: string };

// UC9 extended to students (Stage 6.5 Prompt 6.5.3): a student's own upcoming
// meetings only — read-only (no Add Event, no Google Calendar management,
// those stay counsellor actions), same RLS cal_select policy the counsellor
// view relies on (student_id = auth.uid()).
export default async function StudentCalendarPage() {
  const user = await getSessionUser();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, starts_at, ends_at")
    .eq("student_id", user!.id)
    .order("starts_at", { ascending: true });

  const nativeEvents: CalendarEvent[] = ((events as EventRow[]) ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    source: "native",
    studentId: user!.id,
    studentName: null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
          My Calendar
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">My Calendar</h1>
      </div>

      <CalendarView events={nativeEvents} readOnly />
    </div>
  );
}
