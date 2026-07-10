import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile shared workspace packages.
  transpilePackages: ["@epicenter/ui"],
};

// Sentry build-time config. org/project identify the Sentry project created
// during setup; the DSN and the source-map upload auth token are read from
// environment variables (SENTRY_AUTH_TOKEN), never hardcoded. Source-map upload
// is skipped automatically when no auth token is present.
export default withSentryConfig(nextConfig, {
  org: "epicenter-architecture",
  project: "javascript-nextjs",
  sentryUrl: "https://de.sentry.io/",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Upload a larger set of source maps for readable stack traces.
  widenClientFileUpload: true,
  // Avoid ad-blockers dropping Sentry requests by routing them through the app.
  tunnelRoute: "/monitoring",
});
