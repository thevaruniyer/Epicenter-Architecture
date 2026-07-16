import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors CalendarView's full toolbar (view toggle,
// prev/next, Connect Google Calendar + Add Event) plus the month-grid shape.
// role="status" — see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-40 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-4 shadow-glass">
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border-soft">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={`h-${i}`} className="bg-surface-muted p-2">
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="min-h-24 bg-surface-raised p-1.5">
              <Skeleton className="h-3 w-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
