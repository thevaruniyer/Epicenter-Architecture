"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, Lock } from "lucide-react";
import { Button, Card, cn } from "@epicenter/ui";
import { createNote, type NoteState } from "@/lib/actions/notes";

const initial: NoteState = {};

export function NoteComposer({ studentId }: { studentId: string }) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<"shared" | "private">("shared");
  const [state, formAction, pending] = useActionState(createNote, initial);

  // Clear the composer after every successful save (savedId changes each time);
  // the list re-renders with the note.
  useEffect(() => {
    if (state.savedId) setText("");
  }, [state.savedId]);

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="studentId" value={studentId} />
        <input type="hidden" name="visibility" value={visibility} />

        <label htmlFor="note-text" className="text-sm font-semibold text-ink">
          New meeting note
        </label>
        <textarea
          id="note-text"
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Type the session up in your own words…"
          className="w-full resize-y rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="radiogroup"
            aria-label="Visibility"
            className="inline-flex rounded-md border border-border-soft bg-surface-muted p-1"
          >
            {(
              [
                { value: "shared", label: "Shared", Icon: Eye },
                { value: "private", label: "Counsellor only", Icon: Lock },
              ] as const
            ).map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={visibility === value}
                onClick={() => setVisibility(value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow",
                  visibility === value
                    ? "bg-surface-raised font-semibold text-ink shadow-sm"
                    : "text-ink-secondary hover:text-ink",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          <Button type="submit" size="sm" disabled={pending || !text.trim()}>
            {pending ? "Saving…" : "Save note"}
          </Button>
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-error-ink">
            {state.error}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
