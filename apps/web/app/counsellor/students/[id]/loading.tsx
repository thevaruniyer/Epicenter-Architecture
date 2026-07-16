import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.13: closing a gap in 9.4's sweep — mirrors the Overview
// tab's Handoff/Risk cards, then the Profile completion card. The student
// name/grade/tab-nav header lives in the parent [id]/layout.tsx, a separate
// Suspense scope this loading.tsx doesn't cover. role="status" — see
// counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-3/4" />
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="mt-2 h-8 w-16" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
