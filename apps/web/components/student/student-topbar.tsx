import { SearchPalette } from "@/components/shared/search-palette";
import { searchStudent } from "@/lib/actions/search";
import { NotificationBell, type NotificationRow } from "@/components/shared/notification-bell";

const iconButtonClass =
  "grid size-10 place-items-center rounded-md border border-border-soft bg-surface-raised text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow";

// Student topbar (Stage 8 Prompt 8.5), mirroring apps/web/components/
// counsellor/topbar.tsx's structure — search plus a real Notifications panel
// (Stage 9 Prompt 9.8, styled identically to the counsellor topbar's icon
// buttons). Calendar/Profile icons stay out of scope, as before.
export function StudentTopbar({ notifications }: { notifications: NotificationRow[] }) {
  return (
    <header className="flex items-center gap-4 px-6 py-4">
      <SearchPalette
        searchAction={searchStudent}
        placeholder="Search notes, roadmap, shortlist…"
      />
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell initialNotifications={notifications} iconButtonClassName={iconButtonClass} />
      </div>
    </header>
  );
}
