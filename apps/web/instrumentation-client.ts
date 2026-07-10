// Sentry client-side initialization (browser).
// In @sentry/nextjs v10, the client config lives in this instrumentation-client
// file. DSN comes from a public environment variable, never hardcoded; if unset,
// Sentry is disabled and no-ops.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 1,
  debug: false,
});

// Capture App Router client-side navigation for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
