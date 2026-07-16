import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors the real 2x2 field-card grid (Preferences,
// Extracurriculars, Academics, Interests), each card a label/value pair
// shape. role="status" — see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border-soft bg-surface-raised p-6 shadow-glass">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1.5 h-3 w-32" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-1 h-3.5 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
