"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@epicenter/ui";
import {
  submitFormResponse,
  acknowledgeEmbedForm,
  type ActionState,
  type Question,
} from "@/lib/actions/forms";

const initial: ActionState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

type Form = {
  id: string;
  title: string;
  source: string;
  questions: Question[] | null;
  external_form_id: string | null;
};

// SU8 Screen 2. Native forms render real question fields; Microsoft/Google
// embed the counsellor's external share link in an iframe — there's no API
// access to detect a real submission there, so the student confirms manually.
export function FormResponseDialog({
  form,
  open,
  onOpenChange,
}: {
  form: Form;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitState, submitAction, submitPending] = useActionState(
    submitFormResponse,
    initial,
  );
  const [ackState, ackAction, ackPending] = useActionState(
    acknowledgeEmbedForm,
    initial,
  );
  const state = form.source === "native" ? submitState : ackState;

  useEffect(() => {
    if (state.savedAt) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  const questions = form.questions ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.title}</DialogTitle>
          {form.source !== "native" ? (
            <DialogDescription>
              {form.source === "microsoft_forms" ? "Microsoft Forms" : "Google Forms"}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {form.source === "native" ? (
          <form action={submitAction} className="flex flex-col gap-4">
            <input type="hidden" name="formId" value={form.id} />
            <input type="hidden" name="answers" value={JSON.stringify(answers)} />
            {questions.map((q, i) => (
              <label key={i} className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                {q.prompt}
                {q.type === "multiple_choice" ? (
                  <div className="flex flex-col gap-1.5">
                    {(q.options ?? []).map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-2 text-sm font-normal text-ink"
                      >
                        <input
                          type="radio"
                          name={`q-${i}`}
                          value={opt}
                          checked={answers[i] === opt}
                          onChange={() => setAnswers({ ...answers, [i]: opt })}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : q.type === "date" ? (
                  <input
                    type="date"
                    value={answers[i] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                    className={fieldClass}
                  />
                ) : q.type === "file_upload" ? (
                  <input
                    type="file"
                    onChange={(e) =>
                      setAnswers({ ...answers, [i]: e.target.files?.[0]?.name ?? "" })
                    }
                    className={fieldClass}
                  />
                ) : (
                  <input
                    value={answers[i] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                    className={fieldClass}
                  />
                )}
              </label>
            ))}
            {submitState.error ? (
              <p role="alert" className="text-sm text-error-ink">
                {submitState.error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={submitPending}>
                {submitPending ? "Submitting…" : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            {form.external_form_id ? (
              <iframe
                src={form.external_form_id}
                title={form.title}
                className="h-96 w-full rounded-md border border-border-soft"
              />
            ) : null}
            <p className="text-xs text-ink-tertiary">
              Fill it out above, then confirm below once you&rsquo;ve submitted.
            </p>
            <form action={ackAction}>
              <input type="hidden" name="formId" value={form.id} />
              {ackState.error ? (
                <p role="alert" className="mb-3 text-sm text-error-ink">
                  {ackState.error}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="submit" disabled={ackPending}>
                  {ackPending ? "Saving…" : "I've submitted this"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
