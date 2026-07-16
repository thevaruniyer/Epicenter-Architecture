"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@epicenter/ui";
import { ProductTour, type TourStep } from "@/components/shared/product-tour";

type Phase = "name" | "transition" | "tour";

const NAME_HOLD_MS = 1600;
const NAME_FADE_MS = 600;

// Stage 10 Prompt 10.6: the real first-time welcome, immediately after a
// student finishes onboarding — "Welcome to Epicenter, {name}" full-screen,
// then a transition card over the (blurred) dashboard, then a direct handoff
// into the existing Stage 9 ProductTour engine with no gap or redundant
// screen in between. Only ever mounted when the student just finished
// onboarding this session (see the ?welcome=1 flag in
// lib/actions/onboarding.ts) — an already-onboarded account reaching the
// tour some other way gets the plain Stage 9 tour-only experience instead,
// rendered directly by the caller, not through this component.
export function WelcomeSequence({
  name,
  steps,
}: {
  name: string;
  steps: TourStep[];
}) {
  const [phase, setPhase] = useState<Phase>("name");
  const [nameVisible, setNameVisible] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      setPhase("transition");
      return;
    }

    setNameVisible(true);
    const fadeOutTimer = window.setTimeout(
      () => setNameVisible(false),
      NAME_HOLD_MS,
    );
    const advanceTimer = window.setTimeout(
      () => setPhase("transition"),
      NAME_HOLD_MS + NAME_FADE_MS,
    );
    return () => {
      window.clearTimeout(fadeOutTimer);
      window.clearTimeout(advanceTimer);
    };
  }, []);

  if (phase === "tour") {
    return <ProductTour steps={steps} active />;
  }

  if (phase === "name") {
    return (
      <div
        role="status"
        className={`fixed inset-0 z-[80] grid place-items-center bg-paper transition-opacity duration-600 ease-out motion-reduce:transition-none ${
          nameVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <h1 className="px-6 text-center text-4xl font-bold tracking-tight text-ink text-balance">
          Welcome to Epicenter, {name}
        </h1>
      </div>
    );
  }

  return (
    <Dialog open>
      <DialogContent
        showClose={false}
        className="text-center"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle>Welcome to Epicenter.</DialogTitle>
        <DialogDescription>
          Let&rsquo;s get you familiar with things.
        </DialogDescription>
        <Button className="mx-auto mt-5" onClick={() => setPhase("tour")}>
          Next
        </Button>
      </DialogContent>
    </Dialog>
  );
}
