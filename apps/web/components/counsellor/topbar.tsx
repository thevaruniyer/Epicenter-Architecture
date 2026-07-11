import { Bell, CalendarDays, Search, User } from "lucide-react";

// Counsellor topbar (architecture §6): search + notifications / calendar /
// profile icons. Presentational for the shell; wiring comes with the features.
export function Topbar() {
  return (
    <header className="flex items-center gap-4 px-6 py-4">
      <div className="flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-pill border border-border-soft bg-surface-raised px-4 py-2 text-ink-tertiary">
        <Search className="size-4 shrink-0" aria-hidden />
        <input
          type="search"
          placeholder="Search students, universities…"
          aria-label="Search"
          className="w-full border-0 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-0"
        />
      </div>

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
