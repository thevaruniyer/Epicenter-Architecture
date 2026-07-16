import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors the real shape — a Card per live application
// (title/meta + status pill), each with a divided list of requirement rows.
// role="status" — see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-28 rounded-pill" />
        </div>
        <div className="mt-4 flex flex-col divide-y divide-border-soft border-t border-border-soft pt-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="mt-1 h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-20 rounded-pill" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
