// Sentry server-side initialization (Node.js runtime).
// Loaded from instrumentation.ts register(). DSN comes from an environment
// variable, never hardcoded. If no DSN is set, Sentry is disabled and no-ops.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  // Full tracing in the pilot; tune down before wider rollout.
  tracesSampleRate: 1,
  // Surface useful debug output only when explicitly requested.
  debug: false,
});
