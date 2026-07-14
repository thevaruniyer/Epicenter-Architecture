"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@epicenter/ui";
import { signOut } from "@/lib/actions/auth";
import { SearchPalette } from "@/components/shared/search-palette";
import { searchStudent } from "@/lib/actions/search";

// Student shell nav (Doctrine §18.2): a simpler, guided top pill-nav — not the
// counsellor's persistent professional sidebar.
const NAV = [
  { label: "Home", href: "/student/home" },
  { label: "Roadmap", href: "/student/roadmap" },
  { label: "Notes", href: "/student/notes" },
  { label: "College Shortlist", href: "/student/shortlist" },
  { label: "My Application", href: "/student/application" },
  { label: "My Calendar", href: "/student/calendar" },
  { label: "My Profile", href: "/student/profile" },
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border-soft bg-glass backdrop-blur-glass">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/student/home" className="inline-flex items-center gap-2 font-bold tracking-tight text-ink">
          EPICENTER.
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {NAV.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow",
                  active
                    ? "bg-ink font-semibold text-white"
                    : "text-ink-secondary hover:bg-white/70 hover:text-ink",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <SearchPalette
          searchAction={searchStudent}
          placeholder="Search notes, roadmap, shortlist…"
          variant="icon"
        />

        <form action={signOut}>
          <button
            type="submit"
            aria-label="Log out"
            className="grid size-9 place-items-center rounded-md border border-border-soft bg-surface-raised text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </form>
      </div>
    </header>
  );
}
