import Link from "next/link";
import { Compass } from "lucide-react";
import { Card, buttonVariants, cn } from "@epicenter/ui";
import { getSessionUser } from "@/lib/auth";

// Stage 9 Prompt 9.5: replaces Next.js's default unstyled 404. Can be a
// Server Component (unlike error.tsx, not-found.tsx has no client-only
// reset() prop), so the "go back" destination is resolved from the real
// session rather than guessed from the URL.
export default async function NotFound() {
  const user = await getSessionUser();
  const home =
    user?.role === "student"
      ? { href: "/student/home", label: "Go to Home" }
      : user
        ? { href: "/counsellor/dashboard", label: "Go to Dashboard" }
        : { href: "/login", label: "Go to Login" };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <Card className="max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-lg bg-surface-muted text-ink">
          <Compass className="size-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">
          We could not find that page.
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          The link may be out of date, or the page may have moved. Nothing
          here needs your attention.
        </p>
        <Link href={home.href} className={cn(buttonVariants({ size: "sm" }), "mt-5")}>
          {home.label}
        </Link>
      </Card>
    </div>
  );
}
