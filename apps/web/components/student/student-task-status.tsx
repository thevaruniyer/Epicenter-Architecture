import {
  CheckCircle2,
  Circle,
  CircleDot,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@epicenter/ui";
import type { TaskStatus } from "@/lib/tick-then-confirm";

// Student-facing task status. Same semantic tokens as the counsellor badge, but
// the pending-review label speaks to the student (Doctrine §29): they're waiting
// on the counsellor, not the other way round.
const STATUS: Record<
  TaskStatus,
  { label: string; Icon: LucideIcon; className: string }
> = {
  not_started: {
    label: "To do",
    Icon: Circle,
    className: "border-border-strong bg-surface-muted text-ink-secondary",
  },
  in_progress: {
    label: "In progress",
    Icon: CircleDot,
    className: "border-border-strong bg-surface-raised text-ink",
  },
  pending_review: {
    label: "Waiting for counsellor review",
    Icon: Clock,
    className: "border-pending-border bg-pending-bg text-pending-ink",
  },
  complete: {
    label: "Complete",
    Icon: CheckCircle2,
    className: "border-complete-border bg-complete-bg text-complete-ink",
  },
};

export function StudentTaskStatus({ status }: { status: TaskStatus }) {
  const { label, Icon, className } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
