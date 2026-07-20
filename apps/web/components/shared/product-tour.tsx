"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { completeProductTour } from "@/lib/actions/product-tour";
import { useFocusTrap } from "@/lib/use-focus-trap";

export type TourStep = {
  /** Matches a `data-tour="..."` attribute on the element to spotlight. */
  target: string;
  title: string;
  content: string;
};

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
};

const CALLOUT_WIDTH = 300;
const GAP = 12;

// Stage 9 Prompt 9.10: reusable first-time tour engine — dims/blurs the
// screen, cuts a spotlight out around the current step's target, and shows a
// callout with Next/Skip controls. `active` is computed server-side from
// product_tour_completed_at is null (Prompt 9.11 wires this per role); the
// engine marks completion as soon as it mounts, not when the user finishes,
// so a refresh mid-tour reads completed on next load and never restarts —
// only some future, explicit restart action would show it again.
export function ProductTour({
  steps,
  active,
}: {
  steps: TourStep[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const markedRef = useRef(false);
  const calloutRef = useRef<HTMLDivElement>(null);
  useFocusTrap(calloutRef, open);

  useEffect(() => {
    if (!active || steps.length === 0) return;
    setOpen(true);
    if (!markedRef.current) {
      markedRef.current = true;
      void completeProductTour();
    }
  }, [active, steps.length]);

  useEffect(() => {
    if (!open) return;
    const step = steps[stepIndex];
    if (!step) return;

    function measure() {
      const el = document.querySelector(`[data-tour="${step!.target}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      // The cutout should reveal the exact component, not a padded rectangle
      // built around it — so it takes the target's real border-radius too,
      // not a fixed generic one.
      const borderRadius = window.getComputedStyle(el).borderRadius;
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, borderRadius });
    }

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el?.scrollIntoView({
      // "start" keeps the top of a tall target (e.g. the whole dashboard
      // content region) in view rather than centering it mid-scroll, which
      // for a target taller than the viewport buries the top of the content.
      block: "start",
      behavior: reducedMotion ? "auto" : "smooth",
    });

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, stepIndex, steps]);

  useEffect(() => {
    if (open) calloutRef.current?.focus();
  }, [open, stepIndex]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open || steps.length === 0) return null;

  const step = steps[stepIndex]!;
  const isLast = stepIndex === steps.length - 1;

  function handleNext() {
    if (isLast) {
      setOpen(false);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  // No padding: the cutout matches the target's real getBoundingClientRect()
  // exactly, so it reads as revealing that component, not a box drawn near it.
  const spot = rect;

  const calloutStyle: React.CSSProperties = spot
    ? (() => {
        const EST_HEIGHT = 170;
        const maxTop = Math.max(window.innerHeight - EST_HEIGHT - 16, 16);
        // Prefer just below the spot, then just above it, then clamp into
        // the viewport outright — a spotlighted target taller than the
        // viewport (e.g. the whole dashboard content region) would otherwise
        // push the callout off-screen in either direction.
        let top = spot.top + spot.height + GAP;
        if (top > maxTop) top = spot.top - GAP - EST_HEIGHT;
        top = Math.min(Math.max(top, 16), maxTop);
        return {
          top,
          left: Math.min(
            Math.max(spot.left, 16),
            window.innerWidth - CALLOUT_WIDTH - 16,
          ),
        };
      })()
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {/* Purely visual backdrop/spotlight — the tour's accessible surface is
          the callout dialog below; screen readers skip all of this. */}
      <div aria-hidden>
        {spot ? (
          <>
            <div
              className="fixed inset-x-0 top-0 bg-black/50 backdrop-blur-[1px] transition-[height] duration-200 ease-out motion-reduce:transition-none"
              style={{ height: Math.max(spot.top, 0) }}
            />
            <div
              className="fixed inset-x-0 bottom-0 bg-black/50 backdrop-blur-[1px] transition-[top] duration-200 ease-out motion-reduce:transition-none"
              style={{ top: spot.top + spot.height }}
            />
            <div
              className="fixed bg-black/50 backdrop-blur-[1px] transition-[top,left,width,height] duration-200 ease-out motion-reduce:transition-none"
              style={{ top: spot.top, height: spot.height, left: 0, width: Math.max(spot.left, 0) }}
            />
            <div
              className="fixed bg-black/50 backdrop-blur-[1px] transition-[top,left,height] duration-200 ease-out motion-reduce:transition-none"
              style={{ top: spot.top, height: spot.height, left: spot.left + spot.width, right: 0 }}
            />
            <div
              className="fixed ring-2 ring-yellow transition-[top,left,width,height] duration-200 ease-out motion-reduce:transition-none"
              style={{
                top: spot.top,
                left: spot.left,
                width: spot.width,
                height: spot.height,
                borderRadius: spot.borderRadius,
              }}
            />
            {/* Blocks interaction with the spotlighted element itself — the
                tour is linear (Next/Skip only), not a click-through walkthrough. */}
            <div
              className="fixed"
              style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
            />
          </>
        ) : (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px]" />
        )}
      </div>

      <div
        ref={calloutRef}
        role="dialog"
        aria-label={step.title}
        aria-describedby="product-tour-content"
        tabIndex={-1}
        className="fixed rounded-xl border border-black/[0.08] bg-glass p-4 shadow-glass-float backdrop-blur-glass outline-none transition-[top,left] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: CALLOUT_WIDTH, ...calloutStyle }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-ink">{step.title}</p>
          <button
            type="button"
            aria-label="Skip tour"
            onClick={() => setOpen(false)}
            className="rounded-md p-0.5 text-ink-tertiary transition-colors hover:bg-black/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <p id="product-tour-content" className="mt-1.5 text-sm text-ink-secondary">
          {step.content}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-ink-tertiary">
            {stepIndex + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-md bg-yellow px-3 py-1.5 text-xs font-bold text-ink transition-[filter,transform] duration-150 ease-out hover:brightness-95 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
