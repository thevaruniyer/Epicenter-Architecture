"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AiBadge, Card } from "@epicenter/ui";

// Daily Triage Digest card. One of the three PASSIVE AI features: dismiss-only
// (no save/approve), counsellor-internal. Dismissing hides it for the session —
// there is deliberately no persisted "resolved" state.
export function DigestCard({ lines }: { lines: string[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || lines.length === 0) return null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-ink">Daily digest</h2>
          <AiBadge label="AI-generated" />
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss digest"
          className="rounded-md p-1 text-ink-tertiary transition-colors hover:bg-surface-muted hover:text-ink"
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
    </Card>
  );
}
