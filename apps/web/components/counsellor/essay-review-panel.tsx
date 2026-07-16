"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { AiBadge, Button, Card } from "@epicenter/ui";
import {
  draftEssayFeedback,
  saveEssayFeedback,
  type EssayDraftState,
  type SaveFeedbackState,
} from "@/lib/actions/essay-feedback";

const initialDraft: EssayDraftState = {};
const initialSave: SaveFeedbackState = {};
const fieldClass =
  "w-full resize-y rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

// Review & Feedback panel (Documents tab, §1.9). Opening the review auto-
// generates the AI first pass (structure/clarity/pacing), which pre-fills an
// editable feedback field. Counsellor-side only — the AI badge here is never
// shown to the student on the saved feedback.
export function EssayReviewPanel({ studentId }: { studentId: string }) {
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState("");
  const [aiDraft, setAiDraft] = useState<string | null>(null);

  const [draftState, draftAction, drafting] = useActionState(
    draftEssayFeedback,
    initialDraft,
  );
  const [saveState, saveAction, saving] = useActionState(
    saveEssayFeedback,
    initialSave,
  );

  // Opening the review returns the first pass — pre-fill the feedback field.
  useEffect(() => {
    if (draftState.at && draftState.feedback) {
      setFeedback(draftState.feedback);
      setAiDraft(draftState.feedback);
    }
  }, [draftState.at, draftState.feedback]);

  const aiAssisted = aiDraft !== null;
  const edited = aiAssisted && feedback !== aiDraft;

  return (
    <Card>
      <h2 className="text-base font-bold text-ink">Review &amp; Feedback</h2>
      <p className="mt-1 text-sm text-ink-secondary">
        Paste the student&rsquo;s essay draft. Opening the review drafts a
        first-pass set of observations for you to edit.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Essay draft
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            rows={6}
            placeholder="Paste the draft here…"
            className={fieldClass}
          />
        </label>

        <form action={draftAction} className="w-fit">
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="essay" value={essay} />
          <Button
            type="submit"
            variant="tertiary"
            size="sm"
            disabled={drafting || essay.trim().length < 40}
          >
            <Sparkles className="size-4" aria-hidden />
            {drafting ? "Reading the draft…" : "Review & Feedback"}
          </Button>
        </form>
        {draftState.error ? (
          <p role="alert" className="text-sm text-error-ink">
            {draftState.error}
          </p>
        ) : null}

        {aiAssisted || feedback ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">Your feedback</span>
              {aiAssisted ? <AiBadge label="AI first pass" /> : null}
            </div>
            {aiAssisted ? (
              <p className="text-xs text-ink-tertiary">
                Structure, clarity, and pacing only. Edit freely before saving.
                The student never sees the AI marker on your saved feedback.
              </p>
            ) : null}
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
              placeholder="Write your feedback for the student…"
              className={fieldClass}
            />
            <form action={saveAction} className="flex items-center gap-3">
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="feedback" value={feedback} />
              <input
                type="hidden"
                name="ai_assisted"
                value={aiAssisted ? "true" : "false"}
              />
              <input type="hidden" name="edited" value={edited ? "true" : "false"} />
              <Button type="submit" size="sm" disabled={saving || !feedback.trim()}>
                {saving ? "Saving…" : "Save feedback"}
              </Button>
              {saveState.savedAt ? (
                <span role="status" className="text-sm text-complete-ink">
                  Saved.
                </span>
              ) : null}
              {saveState.error ? (
                <span role="alert" className="text-sm text-error-ink">
                  {saveState.error}
                </span>
              ) : null}
            </form>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
