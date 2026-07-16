import type { SupabaseClient } from "@supabase/supabase-js";

// Stage 9 Prompt 9.7: the three real event points that create a notification
// (reassignment, meeting creation, task assignment) all insert through this
// one helper so the row shape stays consistent. Callers should still await
// this (so it completes before the server action returns), but its result is
// never checked: a failed notification insert must never fail the real
// action it's attached to (the reassignment, the meeting, the task itself).
export async function createNotification(
  supabase: SupabaseClient,
  notification: {
    userId: string;
    type: string;
    title: string;
    body?: string | null;
    ctaLabel?: string | null;
    ctaHref?: string | null;
  },
): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body ?? null,
    cta_label: notification.ctaLabel ?? null,
    cta_href: notification.ctaHref ?? null,
  });
}
