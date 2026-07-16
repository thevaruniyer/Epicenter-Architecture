"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { completeProductTour } from "@/lib/actions/product-tour";

export type TourStep = {
  /** Matches a `data-tour="..."` attribute on the element to spotlight. */
  target: string;
  title: string;
  content: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const CALLOUT_WIDTH = 300;
const GAP = 12;
const PAD = 8;

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
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el?.scrollIntoView({
      block: "center",
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

  const spot = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const calloutStyle: React.CSSProperties = spot
    ? spot.top + spot.height + GAP + 160 < window.innerHeight
      ? {
          top: spot.top + spot.height + GAP,
          left: Math.min(
            Math.max(spot.left, 16),
            window.innerWidth - CALLOUT_WIDTH - 16,
          ),
        }
      : {
          top: Math.max(spot.top - GAP, 16),
          left: Math.min(
            Math.max(spot.left, 16),
            window.innerWidth - CALLOUT_WIDTH - 16,
          ),
          transform: "translateY(-100%)",
        }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {spot ? (
        <>
          <div
            className="fixed inset-x-0 top-0 bg-black/50 backdrop-blur-[1px] transition-all duration-200 ease-out motion-reduce:transition-none"
            style={{ height: Math.max(spot.top, 0) }}
          />
          <div
            className="fixed inset-x-0 bottom-0 bg-black/50 backdrop-blur-[1px] transition-all duration-200 ease-out motion-reduce:transition-none"
            style={{ top: spot.top + spot.height }}
          />
          <div
            className="fixed bg-black/50 backdrop-blur-[1px] transition-all duration-200 ease-out motion-reduce:transition-none"
            style={{ top: spot.top, height: spot.height, left: 0, width: Math.max(spot.left, 0) }}
          />
          <div
            className="fixed bg-black/50 backdrop-blur-[1px] transition-all duration-200 ease-out motion-reduce:transition-none"
            style={{ top: spot.top, height: spot.height, left: spot.left + spot.width, right: 0 }}
          />
          <div
            aria-hidden
            className="fixed rounded-lg ring-2 ring-yellow transition-all duration-200 ease-out motion-reduce:transition-none"
            style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          />
          {/* Blocks interaction with the spotlighted element itself — the tour
              is linear (Next/Skip only), not a click-through walkthrough. */}
          <div
            className="fixed"
            style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px]" />
      )}

      <div
        ref={calloutRef}
        role="dialog"
        aria-label={step.title}
        aria-describedby="product-tour-content"
        tabIndex={-1}
        className="fixed rounded-xl border border-black/[0.08] bg-glass p-4 shadow-glass-float backdrop-blur-glass outline-none"
        style={{ width: CALLOUT_WIDTH, ...calloutStyle }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-ink">{step.title}</p>
          <button
            type="button"
            aria-label="Skip tour"
            onClick={() => setOpen(false)}
            className="rounded-md p-0.5 text-ink-tertiary transition-colors hover:bg-black/5 hover:text-ink"
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
            className="rounded-md bg-yellow px-3 py-1.5 text-xs font-bold text-ink transition hover:brightness-95"
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
