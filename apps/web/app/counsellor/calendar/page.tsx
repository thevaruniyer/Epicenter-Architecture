import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { isGoogleCalendarConfigured, listGoogleEvents } from "@/lib/google-calendar";
import { CalendarView, type CalendarEvent } from "@/components/counsellor/calendar-view";

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  student_id: string | null;
  google_synced: boolean;
};
type Connection = {
  access_token: string | null;
  show_google_in_epicenter: boolean;
  push_epicenter_to_google: boolean;
};

// UC9: My Calendar. Month/week/day views of Epicenter-native events, plus
// optional Google Calendar connect + two independent sync-direction toggles.
export default async function CounsellorCalendarPage() {
  const user = await getSessionUser();
  const supabase = await createClient();

  const [{ data: events }, { data: connection }, { data: students }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, starts_at, ends_at, student_id, google_synced")
      .order("starts_at", { ascending: true }),
    supabase
      .from("google_calendar_connections")
      .select("access_token, show_google_in_epicenter, push_epicenter_to_google")
      .eq("user_id", user!.id)
      .maybeSingle(),
    supabase.from("users").select("id, full_name, email").eq("role", "student"),
  ]);

  const conn = connection as Connection | null;
  const nameById = new Map(
    (students ?? []).map((s) => [s.id, s.full_name ?? s.email]),
  );

  const nativeEvents: CalendarEvent[] = ((events as EventRow[]) ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    source: "native",
    studentId: e.student_id,
    studentName: e.student_id ? nameById.get(e.student_id) ?? null : null,
  }));

  let googleEvents: CalendarEvent[] = [];
  if (conn?.show_google_in_epicenter && conn.access_token && isGoogleCalendarConfigured()) {
    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
      const raw = await listGoogleEvents(conn.access_token, timeMin, timeMax);
      googleEvents = raw.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        source: "google",
        studentId: null,
        studentName: null,
      }));
    } catch {
      // Best-effort — show native events even if the Google fetch fails
      // (expired token, revoked access, etc.); the connect dialog surfaces
      // reconnection separately.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
          My Calendar
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">My Calendar</h1>
      </div>

      <CalendarView
        events={[...nativeEvents, ...googleEvents]}
        connected={Boolean(conn)}
        showGoogle={conn?.show_google_in_epicenter ?? false}
        pushEpicenter={conn?.push_epicenter_to_google ?? false}
        googleConfigured={isGoogleCalendarConfigured()}
        students={(students ?? []).map((s) => ({ id: s.id, name: s.full_name ?? s.email }))}
      />
    </div>
  );
}
