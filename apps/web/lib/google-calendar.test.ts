import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isGoogleCalendarConfigured,
  googleAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  listGoogleEvents,
  insertGoogleEvent,
} from "./google-calendar";

// UC9's Google Calendar sync makes real REST calls to Google. There's no live
// OAuth setup to test against yet (see .env.example) — these mock fetch, per
// the Build Runbook Prompt T.4 ("mock the Google API for this"), since
// Playwright can't intercept a Next.js server process's own outgoing fetch
// calls the way it intercepts the browser's.

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  process.env.GOOGLE_OAUTH_REDIRECT_URI = "http://localhost:3000/api/google/calendar/callback";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("isGoogleCalendarConfigured", () => {
  it("is true once all three env vars are set", () => {
    expect(isGoogleCalendarConfigured()).toBe(true);
  });

  it("is false when any one is missing", () => {
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleCalendarConfigured()).toBe(false);
  });
});

describe("googleAuthUrl", () => {
  it("requests offline access + forces consent so a refresh_token is returned", () => {
    const url = new URL(googleAuthUrl("state-123"));
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(url.searchParams.get("scope")).toContain("calendar");
  });

  it("throws a clear error instead of building a broken URL when unconfigured", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    expect(() => googleAuthUrl("state")).toThrow(/isn't configured/i);
  });
});

describe("exchangeCodeForTokens", () => {
  it("parses a successful token response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "at-1",
          refresh_token: "rt-1",
          expires_in: 3600,
        }),
      }),
    );
    const tokens = await exchangeCodeForTokens("auth-code");
    expect(tokens.accessToken).toBe("at-1");
    expect(tokens.refreshToken).toBe("rt-1");
    expect(tokens.expiresAt).toBeGreaterThan(Date.now());
  });

  it("throws with Google's error body on a failed exchange", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "invalid_grant",
      }),
    );
    await expect(exchangeCodeForTokens("bad-code")).rejects.toThrow(/400/);
  });
});

describe("refreshAccessToken", () => {
  it("returns a new access token, keeping the same refresh token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "at-2", expires_in: 3600 }),
      }),
    );
    const tokens = await refreshAccessToken("rt-1");
    expect(tokens.accessToken).toBe("at-2");
    expect(tokens.refreshToken).toBe("rt-1");
  });
});

describe("listGoogleEvents", () => {
  it("maps Google's event shape to our CalendarEvent shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "g1",
              summary: "Staff Meeting",
              start: { dateTime: "2026-07-15T13:00:00Z" },
              end: { dateTime: "2026-07-15T14:00:00Z" },
            },
          ],
        }),
      }),
    );
    const events = await listGoogleEvents("at-1", "2026-07-01T00:00:00Z", "2026-07-31T00:00:00Z");
    expect(events).toEqual([
      { id: "g1", title: "Staff Meeting", startsAt: "2026-07-15T13:00:00Z", endsAt: "2026-07-15T14:00:00Z" },
    ]);
  });
});

describe("insertGoogleEvent", () => {
  it("returns Google's event id for the newly created event", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "g-new" }),
      }),
    );
    const id = await insertGoogleEvent("at-1", {
      title: "Check-in",
      startsAt: "2026-07-15T10:00:00Z",
      endsAt: "2026-07-15T10:30:00Z",
    });
    expect(id).toBe("g-new");
  });
});
