import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors the real cross-caseload list — a Card per
// application (student/university title + status pill). role="status" —
// see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-3 w-72" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="mt-1.5 h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-28 rounded-pill" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
