import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors DocumentListCard (search bar + document rows)
// and the Review & Feedback card below it. No header skeleton here — the
// student name/grade/tab-nav header lives in the parent [id]/layout.tsx, a
// separate Suspense scope this loading.tsx doesn't cover. role="status" —
// see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="mt-4 h-10 w-full rounded-md" />
        <div className="mt-3 flex flex-col divide-y divide-border-soft">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="size-4 shrink-0 rounded" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="mt-1 h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="size-[34px] shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-1.5 h-3 w-full" />
        <Skeleton className="mt-4 h-28 w-full" />
      </div>
    </div>
  );
}
