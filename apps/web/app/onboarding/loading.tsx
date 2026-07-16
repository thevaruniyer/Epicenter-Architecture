import { Skeleton } from "@epicenter/ui";

// Stage 9 Prompt 9.13: closing a gap in 9.4's sweep — mirrors OnboardingShell's
// split layout (decorative brand panel + step form) without touching the
// fidelity-reference page itself. role="status" — see
// counsellor/dashboard/loading.tsx.
export default function Loading() {
  return (
    <main
      className="grid min-h-screen bg-paper md:grid-cols-2"
      role="status"
      aria-label="Loading"
    >
      <div className="hidden bg-[radial-gradient(circle_at_25%_20%,#FFE88A,transparent_60%),linear-gradient(160deg,#EDC001,#F6D652)] md:block" />
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-56" />
          <div className="mt-8 flex flex-col gap-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="mt-4 h-10 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </main>
  );
}
