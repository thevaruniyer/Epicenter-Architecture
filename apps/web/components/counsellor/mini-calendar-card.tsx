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

  const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    // The day grid below is a visual preview, not a set of 42 individual
    // targets — it's marked aria-hidden and the link carries its own label,
    // so a screen reader hears one clear destination instead of every date
    // in the month concatenated into the link name.
    <Link
      href="/counsellor/calendar"
      aria-label={`Open My Calendar. ${monthLabel}.`}
      className="flex flex-col rounded-lg border border-reach-border bg-reach-bg p-5 shadow-glass transition-transform hover:-translate-y-px motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
    >
      <div className="flex items-center justify-between gap-2" aria-hidden>
        <h2 className="text-sm font-semibold text-ink">{monthLabel}</h2>
        <ChevronRight className="size-4 shrink-0 text-ink-tertiary" />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center" aria-hidden>
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
                    : `grid size-6 place-items-center text-xs ${inMonth ? "text-ink" : "text-ink-tertiary"}`
                }
              >
                {d.getDate()}
              </span>
              <span
                className={`size-1 rounded-full ${hasEvent && !isToday ? "bg-ink/60" : "bg-transparent"}`}
              />
            </div>
          );
        })}
      </div>
    </Link>
  );
}
