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

// UI Reference Calendar.jpg / Calendar 2.jpg's hour-grid range — most
// counsellor/student meetings fall inside a school day; events outside this
// window still render, clipped to the grid edge rather than hidden.
const START_HOUR = 7;
const END_HOUR = 20;
const ROW_HEIGHT = 48;

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

function hourLabel(hour: number): string {
  const h = new Date(2000, 0, 1, hour);
  return h.toLocaleTimeString("en-US", { hour: "numeric" });
}

// UC9: view toggle, "Connect Google Calendar" on the toolbar, Month is a
// sparse chip grid (Doctrine §15.1 calm/professional); Day/Week are a real
// time-positioned hour grid per UI Reference Calendar.jpg/2.jpg, re-skinned in
// Doctrine tokens (never the reference's original purple/blue/green).
export function CalendarView({
  events,
  connected = false,
  showGoogle = false,
  pushEpicenter = false,
  googleConfigured = false,
  students = [],
  readOnly = false,
}: {
  events: CalendarEvent[];
  connected?: boolean;
  showGoogle?: boolean;
  pushEpicenter?: boolean;
  googleConfigured?: boolean;
  students?: { id: string; name: string }[];
  readOnly?: boolean;
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
      ? cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : view === "week"
        ? (() => {
            const s = startOfWeek(cursor);
            const e = new Date(s);
            e.setDate(s.getDate() + 6);
            return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
          })()
        : cursor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

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

        {!readOnly ? (
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
        ) : null}
      </div>

      {view === "month" ? (
        <Card key={view} className="animate-in fade-in duration-200 ease-out motion-reduce:animate-none">
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
        <Card
          key={view}
          className="animate-in fade-in overflow-x-auto duration-200 ease-out motion-reduce:animate-none"
        >
          <div className="flex min-w-[560px]">
            <div className="w-14 shrink-0">
              <div style={{ height: ROW_HEIGHT }} />
              {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i).map((h) => (
                <div key={h} className="relative" style={{ height: ROW_HEIGHT }}>
                  <span className="absolute -top-2 right-2 text-xs text-ink-tertiary">
                    {hourLabel(h)}
                  </span>
                </div>
              ))}
            </div>
            <div
              className={cn(
                "grid flex-1 divide-x divide-border-soft border-l border-border-soft",
                view === "week" ? "grid-cols-7" : "grid-cols-1",
              )}
            >
              {days.map((d, i) => (
                <DayColumn
                  key={i}
                  day={d}
                  events={eventsByDay.get(d.toDateString()) ?? []}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {!readOnly ? (
        <>
          <AddEventDialog open={addOpen} onOpenChange={setAddOpen} students={students} />
          <ConnectGoogleCalendarDialog
            open={connectOpen}
            onOpenChange={setConnectOpen}
            connected={connected}
            showGoogle={showGoogle}
            pushEpicenter={pushEpicenter}
            googleConfigured={googleConfigured}
          />
        </>
      ) : null}
      {selected ? (
        <EventDetailDialog
          event={selected}
          open={Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          showPrep={!readOnly}
        />
      ) : null}
    </>
  );
}

function DayColumn({
  day,
  events,
  onSelect,
}: {
  day: Date;
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
}) {
  const today = sameDay(day, new Date());
  const gridHeight = (END_HOUR - START_HOUR) * ROW_HEIGHT;

  return (
    <div className="flex flex-col">
      <div
        className="flex flex-col items-center justify-center border-b border-border-soft bg-surface-muted"
        style={{ height: ROW_HEIGHT }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          {day.toLocaleDateString("en-US", { weekday: "short" })}
        </p>
        <p
          className={cn(
            "text-sm font-semibold",
            today ? "rounded-pill bg-yellow px-1.5 text-ink" : "text-ink",
          )}
        >
          {day.getDate()}
        </p>
      </div>
      <div className="relative" style={{ height: gridHeight }}>
        {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
          <div
            key={i}
            className="absolute inset-x-0 border-t border-border-soft/60"
            style={{ top: i * ROW_HEIGHT }}
          />
        ))}
        {today ? <NowLine /> : null}
        {events.map((e) => (
          <HourBlock key={e.id} event={e} onClick={() => onSelect(e)} />
        ))}
      </div>
    </div>
  );
}

function clampedOffset(iso: string): number {
  const d = new Date(iso);
  const hours = d.getHours() + d.getMinutes() / 60;
  return Math.min(Math.max(hours, START_HOUR), END_HOUR) - START_HOUR;
}

function NowLine() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  if (hours < START_HOUR || hours > END_HOUR) return null;
  return (
    <div
      className="absolute inset-x-0 z-10 flex items-center gap-1"
      style={{ top: (hours - START_HOUR) * ROW_HEIGHT }}
    >
      <span className="size-2 shrink-0 rounded-full bg-ink" aria-hidden />
      <span className="h-px flex-1 bg-ink" aria-hidden />
    </div>
  );
}

function HourBlock({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const top = clampedOffset(event.startsAt) * ROW_HEIGHT;
  const bottom = clampedOffset(event.endsAt) * ROW_HEIGHT;
  const height = Math.max(bottom - top, 24);
  const time = new Date(event.startsAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute inset-x-1 overflow-hidden rounded-md border px-2 py-1 text-left text-xs font-medium transition-colors",
        event.source === "google"
          ? "border-border-soft bg-surface-muted text-ink-secondary hover:bg-surface-muted/70"
          : "border-yellow/40 bg-yellow/20 text-ink hover:bg-yellow/30",
      )}
      style={{ top, height }}
    >
      <span className="block truncate font-semibold">{event.title}</span>
      <span className="block truncate text-ink-tertiary">{time}</span>
    </button>
  );
}

function EventChip({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
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
      <span className="truncate">{event.title}</span>
    </button>
  );
}
