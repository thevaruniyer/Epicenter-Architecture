"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@epicenter/ui";

// The onboarding step form is a plain server-action form (no useActionState),
// so without this the "Next" click gave zero feedback until the whole round
// trip finished — the wizard felt frozen between steps. useFormStatus works
// with a plain form action; no need to convert the form itself.
export function StepSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-fit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

// Same reasoning as StepSubmitButton, for the secondary text-style actions
// (Previous Page / Skip for now) — otherwise those also give zero feedback
// until their own round trip finishes.
export function StepTextSubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:pointer-events-none disabled:opacity-60`}
    >
      {children}
    </button>
  );
}
