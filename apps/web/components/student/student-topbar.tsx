import { SearchPalette } from "@/components/shared/search-palette";
import { searchStudent } from "@/lib/actions/search";

// Student topbar (Stage 8 Prompt 8.5), mirroring apps/web/components/
// counsellor/topbar.tsx's structure — search only, no notifications/calendar/
// profile icons, since those weren't part of the student experience before
// and adding them isn't in scope here.
export function StudentTopbar() {
  return (
    <header className="flex items-center gap-4 px-6 py-4">
      <SearchPalette
        searchAction={searchStudent}
        placeholder="Search notes, roadmap, shortlist…"
      />
    </header>
  );
}
