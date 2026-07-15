import Link from "next/link";
import { Bell, CalendarDays, User } from "lucide-react";
import { SearchPalette } from "@/components/shared/search-palette";
import { searchCounsellor } from "@/lib/actions/search";

const iconButtonClass =
  "grid size-10 place-items-center rounded-md border border-border-soft bg-surface-raised text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow";

// Counsellor topbar (architecture §6): real functional search (Stage 6.5
// Prompt 6.5.6), a real Calendar link (Stage 8 Prompt 8.3, wiring what was
// previously deferred). Notifications and Profile remain presentational for
// the shell; wiring those is a separate, unnamed prompt.
export function Topbar() {
  return (
    <header className="flex items-center gap-4 px-6 py-4">
      <SearchPalette searchAction={searchCounsellor} placeholder="Search students, notes, applications…" />

      <div className="ml-auto flex items-center gap-2">
        <button type="button" aria-label="Notifications" className={iconButtonClass}>
          <Bell className="size-4" aria-hidden />
        </button>
        <Link href="/counsellor/calendar" aria-label="Calendar" className={iconButtonClass}>
          <CalendarDays className="size-4" aria-hidden />
        </Link>
        <button type="button" aria-label="Profile" className={iconButtonClass}>
          <User className="size-4" aria-hidden />
        </button>
      </div>
    </header>
  );
}
