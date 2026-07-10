"use client";

// Global error boundary. Reports React rendering errors in the App Router to
// Sentry (per Sentry's Next.js manual setup), complementing the server-side
// onRequestError hook in instrumentation.ts.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <h2>Something went wrong.</h2>
      </body>
    </html>
  );
}
