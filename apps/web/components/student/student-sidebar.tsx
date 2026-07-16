"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  Compass,
  GraduationCap,
  Home,
  LogOut,
  NotebookPen,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@epicenter/ui";
import { signOut } from "@/lib/actions/auth";

type NavItem = { label: string; href: string; icon: LucideIcon; tour: string };

// Stage 8 Prompt 8.5, flagged Doctrine exception: a persistent left sidebar
// identical to the counsellor's, reversing Doctrine §18.2's documented
// "simpler, not the counsellor's persistent sidebar" distinction. A
// deliberate product call, not a misread. Built directly from
// apps/web/components/counsellor/sidebar.tsx's structure/treatment: same
// glass surface, same active-state left accent bar. Stage 9 Prompt 9.6
// removed the wordmark from both sidebars entirely (no logo at all now).
const NAV: NavItem[] = [
  { label: "Home", href: "/student/home", icon: Home, tour: "home" },
  { label: "Roadmap", href: "/student/roadmap", icon: Compass, tour: "roadmap" },
  { label: "Notes", href: "/student/notes", icon: NotebookPen, tour: "notes" },
  { label: "College Shortlist", href: "/student/shortlist", icon: GraduationCap, tour: "shortlist" },
  { label: "My Application", href: "/student/application", icon: ClipboardList, tour: "application" },
  { label: "My Calendar", href: "/student/calendar", icon: Calendar, tour: "calendar" },
  { label: "My Profile", href: "/student/profile", icon: User, tour: "profile" },
];

export function StudentSidebar({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-xl border border-black/[0.08] bg-glass p-4 shadow-glass backdrop-blur-glass">
      <div className="mb-6 px-2 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          Student
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ label, href, icon: Icon, tour }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              data-tour={tour}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow",
                active
                  ? "border border-black/[0.08] bg-white/85 font-bold text-ink shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-yellow"
                  : "border border-transparent text-ink-secondary hover:bg-white/70 hover:text-ink",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-border-soft pt-4">
        <p className="truncate px-2 text-xs text-ink-tertiary" title={email ?? undefined}>
          {email}
        </p>
        <form action={signOut} className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-white/70 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
