import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors the real shape — an "Add an Update" composer
// card, then a list of note cards (date/type row, two lines of body text).
// role="status" — see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-16 w-full" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border-soft bg-surface-raised p-4">
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
