import { Skeleton } from "@epicenter/ui";

// Perceived-performance fix (Stage 6.5 Prompt 6.5.7): the real bottleneck is
// server round-trip latency (TTFB), not missing animation — this Suspense
// fallback (App Router's loading.tsx convention) just means the shell paints
// instantly instead of staying blank while that fetch is in flight.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex h-32 flex-col justify-between rounded-lg border border-border-soft bg-surface-raised p-5 shadow-glass">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
