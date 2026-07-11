import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "./lib/cn";

// AI marker (Doctrine §7.10 / §35.7). A minimal BLACK badge — factual, not
// magical: black surface, white label, sparkle icon. Permanent once applied
// (not a "pending" state). Explicitly NOT the superseded violet treatment; no
// gradient, neon, or promotional colour (CLAUDE.md §4).
export interface AiBadgeProps extends React.ComponentProps<"span"> {
  /** "AI-assisted" (default) or "AI-generated". */
  label?: string;
}

export function AiBadge({
  label = "AI-assisted",
  className,
  ...props
}: AiBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white",
        className,
      )}
      {...props}
    >
      <Sparkles className="size-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
