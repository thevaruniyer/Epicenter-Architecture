import { Bell, CalendarDays, User } from "lucide-react";
import { SearchPalette } from "@/components/shared/search-palette";
import { searchCounsellor } from "@/lib/actions/search";

// Counsellor topbar (architecture §6): real functional search (Stage 6.5
// Prompt 6.5.6) + notifications / calendar / profile icons — those three
// remain presentational for the shell; wiring is a separate, unnamed prompt.
export function Topbar() {
  return (
    <header className="flex items-center gap-4 px-6 py-4">
      <SearchPalette searchAction={searchCounsellor} placeholder="Search students, notes, applications…" />

      <div className="ml-auto flex items-center gap-2">
        {[
          { label: "Notifications", Icon: Bell },
          { label: "Calendar", Icon: CalendarDays },
          { label: "Profile", Icon: User },
        ].map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className="grid size-10 place-items-center rounded-md border border-border-soft bg-surface-raised text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
          >
            <Icon className="size-4" aria-hidden />
          </button>
        ))}
      </div>
    </header>
  );
}
