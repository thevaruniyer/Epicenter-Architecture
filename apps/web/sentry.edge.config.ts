// Sentry edge-runtime initialization (middleware / edge routes).
// Loaded from instrumentation.ts register(). DSN from an environment variable.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 1,
  debug: false,
});
