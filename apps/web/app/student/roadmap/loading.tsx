import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors the real milestone-group Card shape (a title,
// then a divided list of task rows). role="status" — see
// counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-48" />
      </div>
      {Array.from({ length: 2 }, (_, g) => (
        <div key={g} className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
          <Skeleton className="mb-3 h-5 w-40" />
          <div className="flex flex-col divide-y divide-border-soft">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-1.5 h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-24 rounded-pill" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
