import * as React from "react";
import { cn } from "./lib/cn";

// Loading-state primitive (Doctrine §31 Loading States): a calm neutral
// pulse, never a spinner. `motion-reduce:animate-none` respects
// prefers-reduced-motion beyond the global CSS rule (belt and suspenders).
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
