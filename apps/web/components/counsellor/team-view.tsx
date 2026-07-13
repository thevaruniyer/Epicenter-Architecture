"use client";

import { useState } from "react";
import { Card, cn } from "@epicenter/ui";
import { ReassignPanel } from "@/components/counsellor/reassign-panel";

export type CounsellorLoad = {
  id: string;
  name: string;
  studentIds: string[];
  students: { id: string; name: string }[];
};

// UC6 Team view: compact rows (Doctrine §15.5 counsellor density — not a card
// grid), each a counsellor's name, a caseload bar, and the raw count. Bar width
// is relative to the busiest counsellor on the team, so it always reads
// sensibly regardless of caseload size.
export function TeamView({ loads }: { loads: CounsellorLoad[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const max = Math.max(1, ...loads.map((l) => l.studentIds.length));
  const selected = loads.find((l) => l.id === selectedId) ?? null;
  const destinations = loads.filter((l) => l.id !== selectedId);

  return (
    <Card>
      <ul className="flex flex-col divide-y divide-border-soft">
        {loads.map((l) => {
          const isSelected = l.id === selectedId;
          const pct = Math.round((l.studentIds.length / max) * 100);
          return (
            <li key={l.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(isSelected ? null : l.id)}
                className={cn(
                  "flex w-full items-center gap-4 px-2 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow",
                  isSelected ? "bg-surface-muted" : "hover:bg-surface-muted/60",
                )}
              >
                <span className="w-40 shrink-0 truncate text-sm font-semibold text-ink">
                  {l.name}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-muted">
                  <span
                    className="block h-full rounded-pill bg-yellow"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-sm font-semibold text-ink-secondary">
                  {l.studentIds.length}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            disabled={selected.studentIds.length === 0}
            className="text-sm font-semibold text-ink underline decoration-yellow decoration-2 underline-offset-4 hover:text-ink-secondary disabled:pointer-events-none disabled:opacity-50"
          >
            Reassign from {selected.name}
          </button>
        </div>
      ) : null}

      {selected ? (
        <ReassignPanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          from={selected}
          destinations={destinations}
        />
      ) : null}
    </Card>
  );
}
