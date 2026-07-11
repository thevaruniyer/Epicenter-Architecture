"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@epicenter/ui";

// Student workspace tabs. Overview is built now; the rest are their own routes,
// filled in over Stage 2 (Meeting Notes, Roadmap) and later stages.
export function StudentTabs({ studentId }: { studentId: string }) {
  const pathname = usePathname();
  const base = `/counsellor/students/${studentId}`;
  const tabs = [
    { label: "Overview", href: base, exact: true },
    { label: "Meeting Notes", href: `${base}/notes` },
    { label: "Roadmap", href: `${base}/roadmap` },
    { label: "Shortlist", href: `${base}/shortlist` },
    { label: "Applications", href: `${base}/applications` },
    { label: "Documents", href: `${base}/documents` },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border-soft pb-3">
      {tabs.map((t) => {
        const active = t.exact
          ? pathname === t.href
          : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-pill px-3.5 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow",
              active
                ? "bg-ink font-semibold text-white"
                : "text-ink-secondary hover:bg-surface-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
