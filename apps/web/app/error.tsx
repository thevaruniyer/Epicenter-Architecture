"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle } from "lucide-react";
import { Button, Card, buttonVariants, cn } from "@epicenter/ui";

// Stage 9 Prompt 9.5: replaces Next.js's default unstyled error page.
// error.tsx boundaries are Client Components (the reset() prop is only
// available client-side), so there is no server session lookup here — the
// "go back" destination is inferred from the URL instead. Never renders the
// raw error message or stack trace; the real error goes to Sentry only.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const home = pathname?.startsWith("/student")
    ? { href: "/student/home", label: "Go to Home" }
    : pathname?.startsWith("/counsellor")
      ? { href: "/counsellor/dashboard", label: "Go to Dashboard" }
      : { href: "/login", label: "Go to Login" };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <Card className="max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-lg bg-surface-muted text-ink">
          <AlertCircle className="size-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">
          Something did not load.
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          This was not your fault, and nothing was lost. Try again, or head
          back to where you were.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" onClick={() => reset()}>
            Try again
          </Button>
          <Link href={home.href} className={cn(buttonVariants({ variant: "tertiary", size: "sm" }))}>
            {home.label}
          </Link>
        </div>
      </Card>
    </div>
  );
}
