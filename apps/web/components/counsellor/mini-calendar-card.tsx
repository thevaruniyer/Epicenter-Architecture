import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Compact month-grid Dashboard widget (Stage 8 Prompt 8.3). CalendarView
// itself has no compact mode and carries its own toolbar/Add Event/Connect
// Google Calendar controls, too heavy for a Dashboard tile, so this is a
// small, read-only grid that deep-links through to the real /counsellor/
// calendar. Background is the Doctrine's existing reach-bg token (#FFF5C7,
// "a calm yellow family distinct from the stronger action yellow," §7.4).
export function MiniCalendarCard({ eventDates }: { eventDates: string[] }) {
  const today = new Date();
  const daysWithEvents = new Set(eventDates.map((d) => new Date(d).toDateString()));

  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  return (
    <Link
      href="/counsellor/calendar"
      className="flex flex-col rounded-lg border border-reach-border bg-reach-bg p-5 shadow-glass transition-transform hover:-translate-y-px motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">
          {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <ChevronRight className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-[11px] font-semibold uppercase text-ink-tertiary">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === today.getMonth();
          const isToday = d.toDateString() === today.toDateString();
          const hasEvent = daysWithEvents.has(d.toDateString());
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 py-0.5">
              <span
                className={
                  isToday
                    ? "grid size-6 place-items-center rounded-full bg-ink text-xs font-bold text-white"
                    : `grid size-6 place-items-center text-xs ${inMonth ? "text-ink" : "text-ink-tertiary/50"}`
                }
              >
                {d.getDate()}
              </span>
              <span
                className={`size-1 rounded-full ${hasEvent && !isToday ? "bg-ink/60" : "bg-transparent"}`}
                aria-hidden
              />
            </div>
          );
        })}
      </div>
    </Link>
  );
}
