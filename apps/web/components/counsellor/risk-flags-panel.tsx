import { AlertTriangle, X } from "lucide-react";
import { AiBadge } from "@epicenter/ui";
import { dismissRiskFlag } from "@/lib/actions/risk-flags";
import type { ActiveRiskFlag } from "@/lib/risk-flags";

// Risk flags on the Overview tab. Passive: dismiss-only, counsellor-internal
// (this whole tab is staff-only), never surfaced to the student. A nudge to
// look closer, phrased factually — not a verdict.
export function RiskFlagsPanel({
  flags,
  studentId,
}: {
  flags: ActiveRiskFlag[];
  studentId: string;
}) {
  if (flags.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {flags.map((flag) => (
        <div
          key={flag.id}
          className="flex items-start gap-3 rounded-lg border border-overdue-border bg-overdue-bg px-4 py-3"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-overdue-ink"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-overdue-ink">
                {flag.type === "grade_drop" ? "Grade risk" : "Pace risk"}
              </span>
              <AiBadge label="AI-generated" />
            </div>
            <p className="text-sm text-ink">{flag.summary}</p>
          </div>
          <form action={dismissRiskFlag}>
            <input type="hidden" name="flagId" value={flag.id} />
            <input type="hidden" name="studentId" value={studentId} />
            <button
              type="submit"
              aria-label="Dismiss flag"
              className="rounded-md p-1 text-overdue-ink transition-colors hover:bg-overdue-border/40"
            >
              <X className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
