import { Clock, X } from "lucide-react";
import { AiBadge } from "@epicenter/ui";
import { dismissStalledAlert } from "@/lib/actions/stalled-tasks";
import type { ActiveStalledAlert } from "@/lib/stalled-tasks";

// Stalled-task alerts on the Roadmap tab. Passive: dismiss-only, counsellor-
// internal (staff-only tab), never surfaced to the student.
export function StalledAlertsPanel({
  alerts,
  studentId,
}: {
  alerts: ActiveStalledAlert[];
  studentId: string;
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 rounded-lg border border-pending-border bg-pending-bg px-4 py-3"
        >
          <Clock className="mt-0.5 size-4 shrink-0 text-pending-ink" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-pending-ink">
                Stalled
              </span>
              <AiBadge label="AI-generated" />
            </div>
            <p className="text-sm text-ink">{alert.summary}</p>
          </div>
          <form action={dismissStalledAlert}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="studentId" value={studentId} />
            <button
              type="submit"
              aria-label="Dismiss alert"
              className="rounded-md p-1 text-pending-ink transition-colors hover:bg-pending-border/40"
            >
              <X className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
