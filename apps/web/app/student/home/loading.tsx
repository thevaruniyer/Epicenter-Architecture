import { Skeleton } from "@epicenter/ui";

// Perceived-performance fix (Stage 6.5 Prompt 6.5.7). Mirrors the
// established-state grid shape; a first-run student sees this same skeleton
// for the same brief instant. role="status" — see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-3 w-1/2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-4 h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
          <Skeleton className="h-5 w-16" />
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
