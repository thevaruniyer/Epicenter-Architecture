import { Skeleton } from "@epicenter/ui";

// Perceived-performance fix (Stage 6.5 Prompt 6.5.7). role="status" so screen
// readers get one "Loading" announcement instead of silence while this
// Suspense fallback is on screen (the pulsing divs themselves carry no
// accessible name and would otherwise announce nothing).
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-3 w-2/3" />
        <Skeleton className="mt-1.5 h-3 w-1/2" />
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-3 h-3 w-1/3" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border-soft bg-surface-raised p-5 shadow-glass">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-4 h-3 w-2/3" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-4 h-8 w-16" />
      </div>
    </div>
  );
}
