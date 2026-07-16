"use client";

import {
  AiBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  StatusPill,
  type PillStatus,
} from "@epicenter/ui";

const STATUSES: PillStatus[] = [
  "complete",
  "overdue",
  "pending",
  "reach",
  "target",
  "safety",
];

// Dev preview of the shared component library, on Doctrine tokens.
export default function UiPreviewPage() {
  return (
    <main className="min-h-screen bg-paper px-6 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
            Epicenter Education
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Shared components
          </h1>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Doctrine variants and focus ring.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="ghost">Ghost</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status pills</CardTitle>
            <CardDescription>Colour + icon + label, never colour alone.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI marker</CardTitle>
            <CardDescription>Minimal black badge. Never violet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <AiBadge />
            <AiBadge label="AI-generated" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dialog (centered)</CardTitle>
            <CardDescription>
              Light for reversible actions, strong for high-impact ones.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="tertiary">Open light dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save changes?</DialogTitle>
                  <DialogDescription>
                    This is a lightweight, reversible confirmation.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="tertiary">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Save</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Open strong dialog</Button>
              </DialogTrigger>
              <DialogContent strength="strong">
                <DialogHeader>
                  <DialogTitle>Reassign this student?</DialogTitle>
                  <DialogDescription>
                    A stronger, centred modal for high-impact actions.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="tertiary">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="destructive">Reassign</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
