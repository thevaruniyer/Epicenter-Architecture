import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.13: closing a gap in 9.4's sweep — mirrors an application
// card (university header + a few requirement rows). role="status" — see
// counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-1.5 h-3 w-56" />
          <div className="mt-3 flex flex-col divide-y divide-border-soft">
            {Array.from({ length: 3 }, (_, j) => (
              <div key={j} className="flex items-center justify-between gap-3 py-2.5">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
