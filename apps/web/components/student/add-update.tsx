"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button, Card } from "@epicenter/ui";
import {
  addStudentUpdate,
  cleanUpStudentUpdate,
  type UpdateState,
  type CleanUpState,
} from "@/lib/actions/student-notes";

const initialSave: UpdateState = {};
const initialClean: CleanUpState = {};

export function AddUpdate() {
  const [text, setText] = useState("");
  const [aiCleaned, setAiCleaned] = useState(false);
  const [rawOriginal, setRawOriginal] = useState("");

  const [saveState, saveAction, saving] = useActionState(
    addStudentUpdate,
    initialSave,
  );
  const [cleanState, cleanAction, cleaning] = useActionState(
    cleanUpStudentUpdate,
    initialClean,
  );

  useEffect(() => {
    if (saveState.savedId) {
      setText("");
      setAiCleaned(false);
      setRawOriginal("");
    }
  }, [saveState.savedId]);

  useEffect(() => {
    if (cleanState.at && cleanState.cleaned) {
      setText(cleanState.cleaned);
      setAiCleaned(true);
    }
  }, [cleanState.at, cleanState.cleaned]);

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <label htmlFor="update-text" className="text-sm font-semibold text-ink">
          Add an update
        </label>

        {aiCleaned ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-soft bg-surface-muted px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Sparkles className="size-3.5" aria-hidden />
              AI-tidied draft — check it still sounds like you, then share.
            </span>
            <button
              type="button"
              onClick={() => {
                setText(rawOriginal);
                setAiCleaned(false);
              }}
              className="text-xs font-semibold text-ink-secondary underline hover:text-ink"
            >
              Revert to what I wrote
            </button>
          </div>
        ) : null}

        <textarea
          id="update-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Share progress or a question with your counsellor…"
          className="w-full resize-y rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow"
        />

        <div className="flex items-center gap-2">
          <form action={cleanAction}>
            <input type="hidden" name="text" value={text} />
            <Button
              type="submit"
              variant="tertiary"
              size="sm"
              disabled={cleaning || !text.trim()}
              onClick={() => setRawOriginal(text)}
            >
              <Sparkles className="size-4" aria-hidden />
              {cleaning ? "Tidying your update…" : "Clean up with AI"}
            </Button>
          </form>

          <form action={saveAction}>
            <input type="hidden" name="text" value={text} />
            <input
              type="hidden"
              name="ai_cleaned"
              value={aiCleaned ? "true" : "false"}
            />
            <input type="hidden" name="raw_text" value={rawOriginal || text} />
            <Button type="submit" size="sm" disabled={saving || !text.trim()}>
              {saving ? "Sharing…" : "Share update"}
            </Button>
          </form>
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
