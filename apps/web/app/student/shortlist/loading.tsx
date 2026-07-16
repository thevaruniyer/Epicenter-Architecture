import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors the real shape — header + Suggest button, a
// list of university cards (title/meta + category/status pills), then the
// priorities worksheet card. role="status" — see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-1.5 h-3 w-2/3" />
              </div>
              <div className="flex shrink-0 gap-2">
                <Skeleton className="h-6 w-16 rounded-pill" />
                <Skeleton className="h-6 w-20 rounded-pill" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-1.5 h-3 w-full" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    </div>
  );
}
