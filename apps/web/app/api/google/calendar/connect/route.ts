import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/auth";
import { googleAuthUrl, isGoogleCalendarConfigured } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

// UC9 Screen 2 "Connect Account" button target. Redirects to Google's OAuth
// consent screen; a short-lived, httpOnly state cookie guards the callback
// against CSRF (verified there, then cleared).
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google Calendar isn't configured yet. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.",
      },
      { status: 501 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("gcal_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(googleAuthUrl(state));
}
