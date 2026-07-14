"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "./lib/cn";
import { Dialog, DialogContent } from "./dialog";

// shadcn's Command primitive (cmdk), re-skinned in Doctrine tokens — no
// bg-popover/text-muted-foreground defaults, and CommandDialog composes our
// own glass Dialog (always-centered, Doctrine §12.2/CLAUDE.md §4) rather than
// shadcn's own generic one.

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-lg bg-surface-raised text-ink",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

function CommandDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="w-[min(560px,calc(100vw-2rem))] overflow-hidden p-0"
      >
        {/* shouldFilter=false: results are already server-searched and
            server-scoped (RLS) — cmdk's own client-side fuzzy filter would
            otherwise re-filter each CommandItem's `value` against the typed
            query and hide every real match, since `value` here is a record
            id, not display text. */}
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-tertiary"
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="flex items-center gap-2 border-b border-border-soft px-4"
    cmdk-input-wrapper=""
  >
    <Search className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-md bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink-tertiary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[400px] overflow-y-auto overflow-x-hidden p-2", className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-8 text-center text-sm text-ink-tertiary"
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group ref={ref} className={cn("overflow-hidden", className)} {...props} />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-secondary outline-none",
      "data-[selected=true]:bg-surface-muted data-[selected=true]:text-ink",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-tertiary",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };
