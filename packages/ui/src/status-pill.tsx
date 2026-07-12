import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./lib/cn";

// Status/category pill (Doctrine §7). Semantic meaning is carried by colour PLUS
// an icon PLUS a label — never colour alone (accessibility). Colours come from
// the Doctrine semantic tokens (bg/border/ink triplets in tailwind.config.ts).
export type PillStatus =
  | "complete"
  | "overdue"
  | "pending"
  | "reach"
  | "target"
  | "safety"
  | "neutral";

const STATUS: Record<
  PillStatus,
  { label: string; Icon: LucideIcon; className: string }
> = {
  neutral: {
    label: "—",
    Icon: Circle,
    className: "bg-surface-muted border-border-strong text-ink-secondary",
  },
  complete: {
    label: "Complete",
    Icon: CheckCircle2,
    className: "bg-complete-bg border-complete-border text-complete-ink",
  },
  overdue: {
    label: "Overdue",
    Icon: AlertCircle,
    className: "bg-overdue-bg border-overdue-border text-overdue-ink",
  },
  pending: {
    label: "Pending review",
    Icon: Clock,
    className: "bg-pending-bg border-pending-border text-pending-ink",
  },
  reach: {
    label: "Reach",
    Icon: TrendingUp,
    className: "bg-reach-bg border-reach-border text-reach-ink",
  },
  target: {
    label: "Target",
    Icon: Target,
    className: "bg-target-bg border-target-border text-target-ink",
  },
  safety: {
    label: "Safety",
    Icon: ShieldCheck,
    className: "bg-safety-bg border-safety-border text-safety-ink",
  },
};

export interface StatusPillProps extends React.ComponentProps<"span"> {
  status: PillStatus;
  /** Override the default label (e.g. "Waiting for counsellor review"). */
  label?: string;
}

export function StatusPill({
  status,
  label,
  className,
  ...props
}: StatusPillProps) {
  const { label: defaultLabel, Icon, className: statusClass } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex min-h-[30px] items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
        statusClass,
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label ?? defaultLabel}
    </span>
  );
}
