import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.4: mirrors StubPage's centered-card shape (icon + title +
// message). This route has no async data (a static placeholder), so this
// skeleton is a belt-and-suspenders match for the Suspense boundary rather
// than something that'll be visible in practice. role="status" — see
// counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
      <div className="max-w-md rounded-lg border border-border-soft bg-surface-raised p-6 text-center shadow-glass">
        <Skeleton className="mx-auto size-12 rounded-lg" />
        <Skeleton className="mx-auto mt-4 h-5 w-32" />
        <Skeleton className="mx-auto mt-2 h-3 w-64" />
      </div>
    </div>
  );
}
