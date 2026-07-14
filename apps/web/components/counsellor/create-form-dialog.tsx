"use client";

import { useActionState, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from "@epicenter/ui";
import {
  createNativeForm,
  createEmbedForm,
  type ActionState,
  type Question,
  type QuestionType,
} from "@/lib/actions/forms";

const initial: ActionState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "short_answer", label: "Short Answer" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "file_upload", label: "File Upload" },
  { value: "date", label: "Date" },
];

type Source = "native" | "microsoft_forms" | "google_forms";
type StudentRow = { id: string; grade: number | null; name: string };

// UC10 Screen 2. Native is the only path that needs no external OAuth — the
// counsellor builds real questions here. Microsoft/Google are "embed" paths:
// there's no Microsoft 365/Entra ID integration in this codebase yet, and
// Google Forms API creation needs the same OAuth credentials Google Calendar
// does (not configured) — so the counsellor creates the form themselves in
// Microsoft/Google Forms and pastes the share link, which renders as an embed.
export function CreateFormDialog({ students }: { students: StudentRow[] }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<Source>("native");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { prompt: "", type: "short_answer" },
  ]);
  const [url, setUrl] = useState("");
  const [audience, setAudience] = useState<"grade" | "choose">("grade");
  const [grade, setGrade] = useState<11 | 12>(11);
  const [chosen, setChosen] = useState<Set<string>>(new Set());

  const [nativeState, nativeAction, nativePending] = useActionState(
    createNativeForm,
    initial,
  );
  const [embedState, embedAction, embedPending] = useActionState(
    createEmbedForm,
    initial,
  );
  const state = source === "native" ? nativeState : embedState;
  const pending = nativePending || embedPending;

  useEffect(() => {
    if (state.savedAt) {
      setOpen(false);
      setTitle("");
      setQuestions([{ prompt: "", type: "short_answer" }]);
      setUrl("");
      setChosen(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  const gradeStudents = students.filter((s) => s.grade === grade);
  const studentIds =
    audience === "grade" ? gradeStudents.map((s) => s.id) : Array.from(chosen);

  function toggleChosen(id: string) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>+ Create Form</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Form</DialogTitle>
          <DialogDescription>
            Native forms need no external account. Microsoft/Google Forms
            embed a form you&rsquo;ve already created there.
          </DialogDescription>
        </DialogHeader>

        <div
          role="radiogroup"
          aria-label="Form type"
          className="inline-flex rounded-md border border-border-soft bg-surface-muted p-1"
        >
          {(
            [
              { value: "native", label: "Native" },
              { value: "microsoft_forms", label: "Microsoft Forms" },
              { value: "google_forms", label: "Google Forms" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={source === value}
              onClick={() => setSource(value)}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors",
                source === value
                  ? "bg-surface-raised font-semibold text-ink shadow-sm"
                  : "text-ink-secondary hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          action={source === "native" ? nativeAction : embedAction}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="studentIds" value={studentIds.join(",")} />
          {source !== "native" ? <input type="hidden" name="source" value={source} /> : null}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Title
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldClass}
            />
          </label>

          {source === "native" ? (
            <>
              <input type="hidden" name="questions" value={JSON.stringify(questions)} />
              <div className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <label className="text-xs font-semibold text-ink-secondary">
                        Question {i + 1} (
                        {QUESTION_TYPES.find((t) => t.value === q.type)?.label})
                      </label>
                      <input
                        value={q.prompt}
                        onChange={(e) =>
                          setQuestions(
                            questions.map((qq, j) =>
                              j === i ? { ...qq, prompt: e.target.value } : qq,
                            ),
                          )
                        }
                        className={fieldClass}
                      />
                      {q.type === "multiple_choice" ? (
                        <input
                          placeholder="Comma-separated options"
                          value={(q.options ?? []).join(", ")}
                          onChange={(e) =>
                            setQuestions(
                              questions.map((qq, j) =>
                                j === i
                                  ? {
                                      ...qq,
                                      options: e.target.value
                                        .split(",")
                                        .map((o) => o.trim())
                                        .filter(Boolean),
                                    }
                                  : qq,
                              ),
                            )
                          }
                          className={`${fieldClass} text-sm`}
                        />
                      ) : null}
                    </div>
                    <select
                      value={q.type}
                      onChange={(e) =>
                        setQuestions(
                          questions.map((qq, j) =>
                            j === i
                              ? { ...qq, type: e.target.value as QuestionType }
                              : qq,
                          ),
                        )
                      }
                      className={`${fieldClass} w-40 shrink-0`}
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label="Remove question"
                      onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
                      className="mt-6 rounded-md p-1.5 text-ink-tertiary hover:bg-surface-muted hover:text-ink"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setQuestions([...questions, { prompt: "", type: "short_answer" }])
                  }
                  className="w-fit text-xs font-semibold text-ink-secondary underline hover:text-ink"
                >
                  + Add question
                </button>
              </div>
            </>
          ) : (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Share link
              <input
                name="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://forms.office.com/… or https://forms.gle/…"
                className={fieldClass}
              />
            </label>
          )}

          <div
            role="radiogroup"
            aria-label="Audience"
            className="inline-flex w-fit rounded-md border border-border-soft bg-surface-muted p-1"
          >
            {(
              [
                { value: "grade", label: `Grade ${grade} Caseload (${gradeStudents.length})` },
                { value: "choose", label: "Choose Students" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={audience === value}
                onClick={() => setAudience(value)}
                className={cn(
                  "rounded px-3 py-1.5 text-sm transition-colors",
                  audience === value
                    ? "bg-surface-raised font-semibold text-ink shadow-sm"
                    : "text-ink-secondary hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {audience === "grade" ? (
            <div className="flex gap-2">
              {[11, 12].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g as 11 | 12)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm",
                    grade === g
                      ? "border-yellow bg-yellow/20 font-semibold text-ink"
                      : "border-border-soft text-ink-secondary",
                  )}
                >
                  Grade {g}
                </button>
              ))}
            </div>
          ) : (
            <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-border-soft p-2">
              {students.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={chosen.has(s.id)}
                    onClick={() => toggleChosen(s.id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-surface-muted"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded border",
                        chosen.has(s.id)
                          ? "border-yellow bg-yellow"
                          : "border-border-strong",
                      )}
                    />
                    {s.name}
                    {s.grade ? ` (Grade ${s.grade})` : ""}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {state.error ? (
            <p role="alert" className="text-sm text-error-ink">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending || studentIds.length === 0}>
              {pending ? "Sending…" : "Create & Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
