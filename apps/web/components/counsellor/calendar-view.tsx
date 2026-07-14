"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, Button, cn } from "@epicenter/ui";
import { AddEventDialog } from "@/components/counsellor/add-event-dialog";
import { ConnectGoogleCalendarDialog } from "@/components/counsellor/connect-google-calendar-dialog";
import { EventDetailDialog } from "@/components/counsellor/event-detail-dialog";

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  source: "native" | "google";
  studentId: string | null;
  studentName: string | null;
};

type View = "day" | "week" | "month";

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

// UC9: month/week/day toggle, "Connect Google Calendar" on the toolbar, a
// sparse grid — a chip only on days that actually have something (Doctrine
// §15.1 calm/professional, never a crowded control room).
export function CalendarView({
  events,
  connected,
  showGoogle,
  pushEpicenter,
  googleConfigured,
  students,
}: {
  events: CalendarEvent[];
  connected: boolean;
  showGoogle: boolean;
  pushEpicenter: boolean;
  googleConfigured: boolean;
  students: { id: string; name: string }[];
}) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = new Date(e.startsAt).toDateString();
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  function step(delta: number) {
    const next = new Date(cursor);
    if (view === "month") next.setMonth(cursor.getMonth() + delta);
    else if (view === "week") next.setDate(cursor.getDate() + delta * 7);
    else next.setDate(cursor.getDate() + delta);
    setCursor(next);
  }

  const label =
    view === "month"
      ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "week"
        ? (() => {
            const s = startOfWeek(cursor);
            const e = new Date(s);
            e.setDate(s.getDate() + 6);
            return `${s.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${e.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
          })()
        : cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const days: Date[] =
    view === "month"
      ? (() => {
          const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
          const gridStart = startOfWeek(first);
          const weeks = Math.ceil((first.getDay() + new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()) / 7);
          return Array.from({ length: weeks * 7 }, (_, i) => {
            const d = new Date(gridStart);
            d.setDate(gridStart.getDate() + i);
            return d;
          });
        })()
      : view === "week"
        ? Array.from({ length: 7 }, (_, i) => {
            const d = startOfWeek(cursor);
            d.setDate(d.getDate() + i);
            return d;
          })
        : [cursor];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            role="radiogroup"
            aria-label="Calendar view"
            className="inline-flex rounded-md border border-border-soft bg-surface-muted p-1"
          >
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded px-3 py-1.5 text-sm capitalize transition-colors",
                  view === v
                    ? "bg-surface-raised font-semibold text-ink shadow-sm"
                    : "text-ink-secondary hover:text-ink",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => step(-1)}
              className="rounded-md p-1.5 text-ink-tertiary hover:bg-surface-muted hover:text-ink"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="min-w-40 text-center text-sm font-semibold text-ink">
              {label}
            </span>
            <button
              type="button"
              aria-label="Next"
              onClick={() => step(1)}
              className="rounded-md p-1.5 text-ink-tertiary hover:bg-surface-muted hover:text-ink"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="text-sm font-semibold text-ink underline decoration-yellow decoration-2 underline-offset-4 hover:text-ink-secondary"
          >
            {connected ? "Google Calendar settings" : "Connect Google Calendar"}
          </button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            + Add Event
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <Card>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border-soft">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="bg-surface-muted p-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-tertiary"
              >
                {d}
              </div>
            ))}
            {days.map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const dayEvents = eventsByDay.get(d.toDateString()) ?? [];
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-24 bg-surface-raised p-1.5",
                    !inMonth && "bg-surface-muted/40 text-ink-tertiary",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      sameDay(d, new Date()) && "rounded-pill bg-yellow px-1.5 py-0.5 text-ink",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <div className="mt-1 flex flex-col gap-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <EventChip key={e.id} event={e} onClick={() => setSelected(e)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card>
          <div className={cn("grid gap-3", view === "week" ? "md:grid-cols-7" : "grid-cols-1")}>
            {days.map((d, i) => {
              const dayEvents = eventsByDay.get(d.toDateString()) ?? [];
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                    {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                  </p>
                  {dayEvents.length ? (
                    dayEvents.map((e) => (
                      <EventChip key={e.id} event={e} onClick={() => setSelected(e)} detailed />
                    ))
                  ) : (
                    <p className="text-xs text-ink-tertiary">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <AddEventDialog open={addOpen} onOpenChange={setAddOpen} students={students} />
      <ConnectGoogleCalendarDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        connected={connected}
        showGoogle={showGoogle}
        pushEpicenter={pushEpicenter}
        googleConfigured={googleConfigured}
      />
      {selected ? (
        <EventDetailDialog
          event={selected}
          open={Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}
    </>
  );
}

function EventChip({
  event,
  onClick,
  detailed = false,
}: {
  event: CalendarEvent;
  onClick: () => void;
  detailed?: boolean;
}) {
  const time = new Date(event.startsAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 truncate rounded-md px-1.5 py-1 text-left text-xs font-medium transition-colors",
        event.source === "google"
          ? "bg-surface-muted text-ink-secondary hover:bg-surface-muted/70"
          : "bg-yellow/25 text-ink hover:bg-yellow/40",
      )}
    >
      {event.source === "google" ? (
        <span className="size-1.5 shrink-0 rounded-full bg-ink-tertiary" aria-hidden />
      ) : null}
      <span className="truncate">
        {detailed ? `${time} — ${event.title}` : event.title}
      </span>
    </button>
  );
}
