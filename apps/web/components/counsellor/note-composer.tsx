"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, Lock, Sparkles } from "lucide-react";
import { Button, Card, cn } from "@epicenter/ui";
import {
  createNote,
  cleanUpMeetingNote,
  type NoteState,
  type CleanUpState,
} from "@/lib/actions/notes";

const initialSave: NoteState = {};
const initialClean: CleanUpState = {};

export function NoteComposer({ studentId }: { studentId: string }) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<"shared" | "private">("shared");
  // Draft-then-approve state: `aiCleaned` marks the current text as an AI draft;
  // `rawOriginal` preserves what the counsellor typed (audit trail per §1.1).
  const [aiCleaned, setAiCleaned] = useState(false);
  const [rawOriginal, setRawOriginal] = useState("");
  // UC9 Screen 6: also log a calendar event (and push to Google if connected).
  const [alsoAddToGoogle, setAlsoAddToGoogle] = useState(false);

  const [saveState, saveAction, saving] = useActionState(createNote, initialSave);
  const [cleanState, cleanAction, cleaning] = useActionState(
    cleanUpMeetingNote,
    initialClean,
  );

  // Clear the composer after every successful save.
  useEffect(() => {
    if (saveState.savedId) {
      setText("");
      setAiCleaned(false);
      setRawOriginal("");
      setAlsoAddToGoogle(false);
    }
  }, [saveState.savedId]);

  // When a cleaned draft returns, swap it in for review (not saved yet).
  useEffect(() => {
    if (cleanState.at && cleanState.cleaned) {
      setText(cleanState.cleaned);
      setAiCleaned(true);
    }
  }, [cleanState.at, cleanState.cleaned]);

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <label htmlFor="note-text" className="text-sm font-semibold text-ink">
          New meeting note
        </label>

        {aiCleaned ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-soft bg-surface-muted px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Sparkles className="size-3.5" aria-hidden />
              AI-assisted draft. Review and edit, then save. The badge stays once
              saved.
            </span>
            <button
              type="button"
              onClick={() => {
                setText(rawOriginal);
                setAiCleaned(false);
              }}
              className="text-xs font-semibold text-ink-secondary underline hover:text-ink"
            >
              Revert to what I typed
            </button>
          </div>
        ) : null}

        <textarea
          id="note-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Type the session up in your own words…"
          className="w-full resize-y rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow"
        />

        <label className="inline-flex w-fit items-center gap-2 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={alsoAddToGoogle}
            onChange={(e) => setAlsoAddToGoogle(e.target.checked)}
            className="size-4 rounded border-border-strong accent-yellow"
          />
          Also add to Google Calendar
        </label>

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

          <div className="flex items-center gap-2">
            {/* Clean-up: produces a draft, never saves. */}
            <form action={cleanAction}>
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="text" value={text} />
              <Button
                type="submit"
                variant="tertiary"
                size="sm"
                disabled={cleaning || !text.trim()}
                onClick={() => setRawOriginal(text)}
              >
                <Sparkles className="size-4" aria-hidden />
                {cleaning ? "Structuring your note…" : "Clean up with AI"}
              </Button>
            </form>

            {/* Save: the only thing that persists the note. */}
            <form action={saveAction}>
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="visibility" value={visibility} />
              <input type="hidden" name="text" value={text} />
              <input
                type="hidden"
                name="ai_cleaned"
                value={aiCleaned ? "true" : "false"}
              />
              <input type="hidden" name="raw_text" value={rawOriginal || text} />
              <input
                type="hidden"
                name="also_add_to_google_calendar"
                value={alsoAddToGoogle ? "true" : "false"}
              />
              <Button type="submit" size="sm" disabled={saving || !text.trim()}>
                {saving ? "Saving…" : "Save note"}
              </Button>
            </form>
          </div>
        </div>

        {cleanState.error ? (
          <p role="alert" className="text-sm text-error-ink">
            {cleanState.error}
          </p>
        ) : null}
        {saveState.error ? (
          <p role="alert" className="text-sm text-error-ink">
            {saveState.error}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
