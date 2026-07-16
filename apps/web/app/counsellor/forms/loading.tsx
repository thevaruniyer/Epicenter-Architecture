import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors the real forms list — icon, title/source,
// response tally, and a View button per row. role="status" — see
// counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <div className="flex flex-col divide-y divide-border-soft">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-2 py-3">
              <Skeleton className="size-5 shrink-0 rounded" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
