import type { LucideIcon } from "lucide-react";
import { Card } from "@epicenter/ui";

// On-brand placeholder for counsellor sections that render a real route but whose
// full feature lands in a later prompt/phase (no dead ends, no 404s).
export function StubPage({
  icon: Icon,
  title,
  message,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  badge?: string;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card className="max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-lg bg-surface-muted text-ink">
          <Icon className="size-6" aria-hidden />
        </div>
        {badge ? (
          <span className="mt-4 inline-flex items-center rounded-pill border border-border-strong bg-surface-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink-secondary">
            {badge}
          </span>
        ) : null}
        <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-secondary">{message}</p>
      </Card>
    </div>
  );
}
