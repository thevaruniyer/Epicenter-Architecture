"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const TITLE = "Let's all be on the same page";
const TYPE_INTERVAL_MS = 35;
const POST_TYPE_PAUSE_MS = 150;
const SUBTITLE_FADE_MS = 400;

type Phase = "typing" | "subtitle" | "control";

// Stage 9 Prompt 9.9: staged reveal (type → subtitle fade → control), each
// step gated on the previous one finishing rather than firing together.
// prefers-reduced-motion skips straight to the fully-revealed end state.
export function LandingHero() {
  const [typedLength, setTypedLength] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotionRef.current) {
      setTypedLength(TITLE.length);
      setPhase("control");
      return;
    }

    let i = 0;
    const typeTimer = window.setInterval(() => {
      i += 1;
      setTypedLength(i);
      if (i >= TITLE.length) {
        window.clearInterval(typeTimer);
        window.setTimeout(() => setPhase("subtitle"), POST_TYPE_PAUSE_MS);
      }
    }, TYPE_INTERVAL_MS);

    return () => window.clearInterval(typeTimer);
  }, []);

  useEffect(() => {
    if (phase !== "subtitle") return;
    const timer = window.setTimeout(
      () => setPhase("control"),
      SUBTITLE_FADE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase]);

  const titleDone = typedLength >= TITLE.length;

  return (
    <div>
      <p className="text-lg font-semibold tracking-tight text-ink-secondary">
        Epicenter.
      </p>
      <h1
        aria-label={TITLE}
        className="mt-2 min-h-[1.2em] text-4xl font-bold tracking-tight text-ink"
      >
        <span aria-hidden>{TITLE.slice(0, typedLength)}</span>
        <span
          aria-hidden
          className={`ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.1em] bg-ink align-middle ${
            titleDone ? "opacity-0" : "animate-pulse opacity-100"
          }`}
        />
      </h1>
      <p
        className={`mt-3 text-xs font-bold uppercase tracking-wide text-ink-tertiary transition-opacity duration-400 ease-out motion-reduce:transition-none ${
          phase === "typing" ? "opacity-0" : "opacity-100"
        }`}
      >
        The AI LMS built for counsellors and students
      </p>
      <div
        className={`mt-6 flex justify-center transition-opacity duration-400 ease-out motion-reduce:transition-none ${
          phase === "control" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <LoginSignupControl />
      </div>
    </div>
  );
}

function LoginSignupControl() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="landing-auth-options"
        className="flex items-center gap-2 rounded-md bg-yellow px-5 py-2.5 font-bold text-ink transition-[filter,transform] duration-150 ease-out hover:brightness-95 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
      >
        Get started
        <ChevronDown
          aria-hidden
          className={`size-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        id="landing-auth-options"
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-yellow px-5 py-2.5 font-bold text-ink transition-[filter,transform] duration-150 ease-out hover:brightness-95 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-border-strong bg-surface-raised px-5 py-2.5 font-semibold text-ink transition-[background-color,transform] duration-150 ease-out hover:bg-surface-muted active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
