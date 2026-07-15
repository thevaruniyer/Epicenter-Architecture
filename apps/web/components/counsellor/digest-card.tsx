"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AiBadge } from "@epicenter/ui";

// Daily Triage Digest card. One of the three PASSIVE AI features: dismiss-only
// (no save/approve), counsellor-internal. Dismissing hides it for the session —
// there is deliberately no persisted "resolved" state.
//
// Stage 8 Prompt 8.3, flagged Doctrine exception: the card surface uses a
// liquid-glass, mellow pink gradient, which contradicts Doctrine §7.10's "no
// gradient for AI-assisted content" rule. This is a deliberate product call,
// not a misread — the AiBadge marker itself stays the standard black badge.
// See the Stage 8 Build Runbook note for the rationale.
export function DigestCard({ lines }: { lines: string[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || lines.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#F2D9DE] bg-gradient-to-br from-[#FDEEF2] via-[#FBF3F6] to-glass p-6 shadow-glass backdrop-blur-glass">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-ink">Daily digest</h2>
          <AiBadge label="AI-generated" />
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss digest"
          className="rounded-md p-1 text-ink-tertiary transition-colors hover:bg-black/5 hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {lines.map((line, i) => (
          <li key={i} className="text-sm text-ink-secondary">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
