"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button, cn } from "@epicenter/ui";

export type StudentSummary = {
  id: string;
  name: string;
  grade: number | null;
  major: string | null;
};

export function StudentsGrid({ students }: { students: StudentSummary[] }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMode() {
    setSelectMode((m) => !m);
    setSelected(new Set());
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
            Students
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
            Your caseload
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {selectMode ? (
            <span className="text-sm text-ink-secondary" aria-live="polite">
              {selected.size} selected
            </span>
          ) : null}
          <Button variant="tertiary" size="sm" onClick={toggleMode}>
            {selectMode ? "Done" : "Select"}
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-ink-secondary">
          No students are assigned to you yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => {
            const isSelected = selected.has(s.id);
            const cardClass = cn(
              "relative flex h-full flex-col rounded-lg border bg-surface-raised p-5 text-left shadow-glass transition-colors",
              isSelected
                ? "border-yellow ring-2 ring-yellow"
                : "border-border-soft hover:border-border-strong",
            );
            const body = (
              <>
                {selectMode ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute right-4 top-4 grid size-5 place-items-center rounded border",
                      isSelected
                        ? "border-yellow bg-yellow text-ink"
                        : "border-border-strong bg-surface-raised",
                    )}
                  >
                    {isSelected ? <Check className="size-3.5" /> : null}
                  </span>
                ) : null}
                <span className="text-base font-bold text-ink">{s.name}</span>
                <span className="mt-1 text-sm text-ink-secondary">
                  {s.grade ? `Grade ${s.grade}` : "Grade —"}
                  {s.major ? ` · ${s.major}` : ""}
                </span>
                {!selectMode ? (
                  <span className="mt-4 text-sm font-semibold text-ink">
                    Go to student →
                  </span>
                ) : null}
              </>
            );

            return (
              <li key={s.id}>
                {selectMode ? (
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggle(s.id)}
                    className={cn(cardClass, "w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow")}
                  >
                    {body}
                  </button>
                ) : (
                  <Link
                    href={`/counsellor/students/${s.id}`}
                    className={cn(cardClass, "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow")}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
