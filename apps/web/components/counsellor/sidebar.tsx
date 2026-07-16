"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@epicenter/ui";
import { signOut } from "@/lib/actions/auth";
import { ROLE_LABELS, type UserRole } from "@/lib/roles";

type NavItem = { label: string; href: string; icon: LucideIcon; tour: string };

// Fixed counsellor navigation shell (Doctrine §18.1, architecture §6). Head of
// Counselling sees Team where a counsellor sees Students.
function navFor(role: UserRole): NavItem[] {
  const students: NavItem =
    role === "head_of_counselling"
      ? { label: "Team", href: "/counsellor/team", icon: UsersRound, tour: "students" }
      : { label: "Students", href: "/counsellor/students", icon: Users, tour: "students" };

  return [
    { label: "Dashboard", href: "/counsellor/dashboard", icon: LayoutDashboard, tour: "dashboard" },
    students,
    { label: "Applications Centre", href: "/counsellor/applications", icon: GraduationCap, tour: "applications" },
    { label: "Internal Notes", href: "/counsellor/notes", icon: NotebookPen, tour: "notes" },
    { label: "Reports", href: "/counsellor/reports", icon: BarChart3, tour: "reports" },
    { label: "Forms", href: "/counsellor/forms", icon: ClipboardList, tour: "forms" },
    { label: "My Calendar", href: "/counsellor/calendar", icon: Calendar, tour: "calendar" },
  ];
}

export function Sidebar({
  role,
  email,
}: {
  role: UserRole;
  email: string | null;
}) {
  const pathname = usePathname();
  const items = navFor(role);

  return (
    <aside className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-xl border border-black/[0.08] bg-glass p-4 shadow-glass backdrop-blur-glass">
      <div className="mb-6 px-2 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          {ROLE_LABELS[role]}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ label, href, icon: Icon, tour }) => {
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
