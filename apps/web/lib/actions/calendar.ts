"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { insertGoogleEvent, isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { createNotification } from "@/lib/notifications";

export type ActionState = { error?: string; savedAt?: number };

// UC9 "+ Add Event". Optionally pushes to Google Calendar too if the
// counsellor has push_epicenter_to_google enabled — best-effort: a Google
// push failure never blocks saving the Epicenter-native event.
export async function createCalendarEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const studentId = String(formData.get("studentId") ?? "").trim() || null;
  if (!title) return { error: "Give the event a title." };
  if (!startsAt || !endsAt) return { error: "Set a start and end time." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event, error } = await supabase
    .from("calendar_events")
    .insert({
      counsellor_id: user.id,
      student_id: studentId,
      title,
      starts_at: startsAt,
      ends_at: endsAt,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await pushToGoogleIfEnabled(supabase, user.id, event.id as string, title, startsAt, endsAt);

  // Notify the student (Stage 9 Prompt 9.7) — only when the event is actually
  // for a specific student, not a counsellor's own unattached calendar block.
  if (studentId) {
    await createNotification(supabase, {
      userId: studentId,
      type: "meeting",
      title: `Your counsellor scheduled a meeting: ${title}`,
      ctaLabel: "Go to Calendar",
      ctaHref: "/student/calendar",
    });
  }

  revalidatePath("/counsellor/calendar");
  return { savedAt: Date.now() };
}

async function pushToGoogleIfEnabled(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  eventId: string,
  title: string,
  startsAt: string,
  endsAt: string,
): Promise<void> {
  if (!isGoogleCalendarConfigured()) return;
  try {
    const { data: connection } = await supabase
      .from("google_calendar_connections")
      .select("access_token, push_epicenter_to_google")
      .eq("user_id", userId)
      .maybeSingle();
    if (!connection?.push_epicenter_to_google || !connection.access_token) return;

    const googleEventId = await insertGoogleEvent(connection.access_token, {
      title,
      startsAt,
      endsAt,
    });
    await supabase
      .from("calendar_events")
      .update({ google_synced: true, google_event_id: googleEventId })
      .eq("id", eventId);
  } catch (err) {
    // Best-effort — the Epicenter-native event is already saved either way.
    Sentry.captureException(err, { tags: { feature: "google_calendar_push" } });
  }
}

// UC9 Screen 3: the two independent sync-direction toggles. Native checkboxes
// only appear in FormData when checked ("on"), so an unchecked box and a
// missing field are indistinguishable — the toggle UI submits an explicit
// hidden "true"/"false" instead of relying on checkbox presence.
export async function updateSyncSettings(formData: FormData): Promise<void> {
  const showGoogle = formData.get("show_google_in_epicenter") === "true";
  const pushEpicenter = formData.get("push_epicenter_to_google") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("google_calendar_connections")
    .update({
      show_google_in_epicenter: showGoogle,
      push_epicenter_to_google: pushEpicenter,
    })
    .eq("user_id", user.id);

  revalidatePath("/counsellor/calendar");
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("google_calendar_connections").delete().eq("user_id", user.id);
  revalidatePath("/counsellor/calendar");
}
