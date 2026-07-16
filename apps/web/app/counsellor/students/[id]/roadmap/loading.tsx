import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.13: closing a gap in 9.4's sweep — mirrors the milestone
// group cards (each a header row + a few task rows). role="status" — see
// counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
          <Skeleton className="h-4 w-32" />
          <div className="mt-3 flex flex-col divide-y divide-border-soft">
            {Array.from({ length: 3 }, (_, j) => (
              <div key={j} className="flex items-center gap-3 py-3">
                <Skeleton className="size-4 shrink-0 rounded" />
                <Skeleton className="h-3.5 flex-1" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
