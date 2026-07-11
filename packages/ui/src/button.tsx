import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/cn";

// Button (Doctrine § buttons). Yellow primary; soft-yellow secondary; outline
// tertiary; semantic destructive. Doctrine focus ring (3px yellow, offset) and
// subtle lift on hover. Default shadcn styling is deliberately not shipped.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border border-transparent text-sm font-bold whitespace-nowrap transition-[transform,box-shadow,background-color,filter] duration-150 ease-out hover:-translate-y-px motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-yellow disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-yellow text-ink hover:brightness-95",
        secondary: "border-[#E6CF5A] bg-[#FFF8D2] text-ink hover:brightness-95",
        tertiary:
          "border-border-soft bg-surface-raised text-ink hover:bg-surface-muted",
        destructive:
          "border-error-border bg-error-bg text-error-ink hover:brightness-95",
        ghost: "text-ink hover:bg-surface-muted",
      },
      size: {
        default: "min-h-[42px] px-4 py-2.5",
        sm: "min-h-[34px] px-3 py-2 text-[13px]",
        icon: "size-[42px]",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
