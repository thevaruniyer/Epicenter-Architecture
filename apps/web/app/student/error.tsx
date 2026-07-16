"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle } from "lucide-react";
import { Button, Card, buttonVariants, cn } from "@epicenter/ui";

// Stage 9 Prompt 9.5: a role-scoped boundary, not just a duplicate of the
// root error.tsx. Nesting it here means it renders inside
// student/layout.tsx — the sidebar stays on screen and a student can still
// navigate away normally; without this, any error anywhere in the student
// shell would fall through to the root error.tsx and blank out the entire
// shell. The destination is unambiguous here (we are definitively inside
// the student section), so no URL guessing like the root boundary needs.
export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card className="max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-lg bg-surface-muted text-ink">
          <AlertCircle className="size-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">
          This page did not load.
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          This was not your fault, and nothing was lost. Try again, or go
          back to Home.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" onClick={() => reset()}>
            Try again
          </Button>
          <Link
            href="/student/home"
            className={cn(buttonVariants({ variant: "tertiary", size: "sm" }))}
          >
            Go to Home
          </Link>
        </div>
      </Card>
    </div>
  );
}
