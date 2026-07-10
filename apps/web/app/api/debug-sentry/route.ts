import { NextResponse } from "next/server";

// TEST-ONLY route. Deliberately throws so Sentry error capture can be verified
// end-to-end at the end of every stage (Build Runbook — Sentry verification step).
// Not wired into any real feature. The unhandled throw is reported to Sentry via
// the onRequestError hook in instrumentation.ts.
export const dynamic = "force-dynamic";

export function GET() {
  throw new Error("Sentry test error from /api/debug-sentry (deliberate).");

  // Unreachable — present only so the handler has a well-typed success shape.
  // eslint-disable-next-line no-unreachable
  return NextResponse.json({ ok: true });
}
