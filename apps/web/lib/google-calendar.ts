// Google Calendar OAuth + REST helpers (UC9). Direct fetch calls to Google's
// documented REST endpoints — no googleapis dependency, matching how the rest
// of this codebase talks to external APIs (Gemini via @google/genai is the one
// exception, since it's a first-party SDK; there's no equivalent lightweight
// SDK need here).
//
// Requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_OAUTH_REDIRECT_URI
// env vars (server-side only, never NEXT_PUBLIC_). Until those are set, every
// function here throws a clear "not configured" error rather than a confusing
// fetch failure — see isGoogleCalendarConfigured().

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REDIRECT_URI,
  );
}

function requireConfig() {
  if (!isGoogleCalendarConfigured()) {
    throw new Error(
      "Google Calendar isn't configured yet — GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_OAUTH_REDIRECT_URI are not set.",
    );
  }
  return {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
  };
}

// Step 1: build the consent-screen URL. access_type=offline + prompt=consent
// so Google actually returns a refresh_token (otherwise only returned once,
// ever, on a user's very first authorization — offline+consent forces it
// every time, which is what a "Connect Account" button needs).
export function googleAuthUrl(state: string): string {
  const { clientId, redirectUri } = requireConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // epoch ms
}

// Step 2: exchange the authorization code for tokens.
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = requireConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

// Refresh an expired access token using the stored refresh token.
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const { clientId, clientSecret } = requireConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken, // refresh tokens don't rotate on this grant type
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export interface GoogleEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
}

// List events on the user's primary calendar within a window (for "Show
// Google events in My Calendar").
export async function listGoogleEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<GoogleEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`Google Calendar list failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    items: { id: string; summary?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }[];
  };
  return data.items.map((e) => ({
    id: e.id,
    title: e.summary ?? "(untitled)",
    startsAt: e.start.dateTime ?? e.start.date ?? "",
    endsAt: e.end.dateTime ?? e.end.date ?? "",
  }));
}

// Push an Epicenter meeting to Google Calendar (for "Add new Epicenter
// meetings to Google Calendar"). Returns Google's event id to store as
// calendar_events.google_event_id.
export async function insertGoogleEvent(
  accessToken: string,
  event: { title: string; startsAt: string; endsAt: string },
): Promise<string> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.title,
        start: { dateTime: event.startsAt },
        end: { dateTime: event.endsAt },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Google Calendar insert failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}
