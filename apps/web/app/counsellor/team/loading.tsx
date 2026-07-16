import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors TeamView's compact rows — name, caseload bar,
// count, per counsellor. role="status" — see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-3 w-64" />
      </div>
      <div className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
        <div className="flex flex-col divide-y divide-border-soft">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-2 py-3">
              <Skeleton className="h-3.5 w-28 shrink-0" />
              <Skeleton className="h-2 flex-1 rounded-pill" />
              <Skeleton className="h-3.5 w-6 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
