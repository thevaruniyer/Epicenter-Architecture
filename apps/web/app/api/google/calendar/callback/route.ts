import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const calendarUrl = new URL("/counsellor/calendar", request.url);

  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gcal_oauth_state")?.value;
  cookieStore.delete("gcal_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    calendarUrl.searchParams.set("gcal_error", "invalid_state");
    return NextResponse.redirect(calendarUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const supabase = await createClient();
    const { error } = await supabase.from("google_calendar_connections").upsert({
      user_id: user.id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      show_google_in_epicenter: false,
      push_epicenter_to_google: false,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: "google_calendar_oauth" } });
    calendarUrl.searchParams.set("gcal_error", "connect_failed");
    return NextResponse.redirect(calendarUrl);
  }

  calendarUrl.searchParams.set("gcal_connected", "1");
  return NextResponse.redirect(calendarUrl);
}
