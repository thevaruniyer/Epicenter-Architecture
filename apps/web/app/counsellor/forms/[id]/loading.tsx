import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.13: closing a gap in 9.4's sweep — mirrors the form-detail
// header, then the assignment status card. role="status" — see
// counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-8 w-64" />
        <Skeleton className="mt-2 h-3.5 w-40" />
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-2/3" />
      </div>
    </div>
  );
}
