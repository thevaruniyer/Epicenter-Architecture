import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.13: closing a gap in 9.4's sweep — mirrors the composer,
// then a few note cards. role="status" — see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="rounded-lg border border-border-soft bg-surface-raised p-4">
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="mt-3 h-9 w-28 rounded-md" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="rounded-lg border border-border-soft bg-surface-raised p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-16 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mt-2 h-3.5 w-full" />
          <Skeleton className="mt-1 h-3.5 w-2/3" />
        </div>
      ))}
    </div>
  );
}
