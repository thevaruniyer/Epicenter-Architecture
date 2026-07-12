"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import {
  AiBadge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@epicenter/ui";
import {
  extractChecklist,
  saveExtractedRequirements,
  type ChecklistState,
  type ActionState,
} from "@/lib/actions/applications";

type Item = { title: string; type: string };

const initialExtract: ChecklistState = {};
const initialSave: ActionState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow";

const TYPES = [
  { value: "essay", label: "Essay" },
  { value: "transcript", label: "Transcript" },
  { value: "recommendation", label: "Recommendation" },
  { value: "form", label: "Form" },
  { value: "other", label: "Other" },
];

// UC5 / §1.10: paste raw requirements text, get an editable AI checklist, edit,
// then save as the application's real requirements. Draft-then-approve.
export function PasteRequirementsDialog({
  applicationId,
  studentId,
}: {
  applicationId: string;
  studentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);

  const [extractState, extractAction, extracting] = useActionState(
    extractChecklist,
    initialExtract,
  );
  const [saveState, saveAction, saving] = useActionState(
    saveExtractedRequirements,
    initialSave,
  );

  useEffect(() => {
    if (extractState.at && extractState.items) setItems(extractState.items);
  }, [extractState.at, extractState.items]);

  useEffect(() => {
    if (saveState.savedAt) {
      setOpen(false);
      setText("");
      setItems(null);
    }
  }, [saveState.savedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="sm">
          Paste requirements
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paste requirements</DialogTitle>
          <DialogDescription>
            Paste the university&rsquo;s requirements text; AI drafts a checklist
            you edit before saving.
          </DialogDescription>
        </DialogHeader>

        {items === null ? (
          <form action={extractAction} className="flex flex-col gap-3">
            <input type="hidden" name="studentId" value={studentId} />
            <textarea
              name="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="e.g. Personal statement (4000 char max). One academic reference. Full transcript…"
              className={`${fieldClass} resize-y`}
            />
            {extractState.error ? (
              <p role="alert" className="text-sm text-error-ink">
                {extractState.error}
              </p>
            ) : null}
            <Button
              type="submit"
              size="sm"
              disabled={extracting || text.trim().length < 20}
              className="w-fit"
            >
              <Sparkles className="size-4" aria-hidden />
              {extracting ? "Extracting…" : "Extract checklist"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">
                Extracted checklist
              </span>
              <AiBadge label="AI-extracted" />
            </div>
            <p className="text-xs text-ink-tertiary">
              Edit, remove, or add rows. The AI badge stays on these once saved.
            </p>

            <ul className="flex flex-col gap-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    value={item.title}
                    onChange={(e) =>
                      setItems(
                        items.map((it, j) =>
                          j === i ? { ...it, title: e.target.value } : it,
                        ),
                      )
                    }
                    className={fieldClass}
                  />
                  <select
                    value={item.type}
                    onChange={(e) =>
                      setItems(
                        items.map((it, j) =>
                          j === i ? { ...it, type: e.target.value } : it,
                        ),
                      )
                    }
                    className={`${fieldClass} w-40`}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label="Remove row"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="rounded-md p-1.5 text-ink-tertiary hover:bg-surface-muted hover:text-ink"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setItems([...items, { title: "", type: "other" }])}
              className="w-fit text-xs font-semibold text-ink-secondary underline hover:text-ink"
            >
              + Add a row
            </button>

            <form action={saveAction} className="flex items-center gap-3">
              <input type="hidden" name="applicationId" value={applicationId} />
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="items" value={JSON.stringify(items)} />
              <Button
                type="submit"
                size="sm"
                disabled={saving || items.length === 0}
              >
                {saving ? "Saving…" : "Save requirements"}
              </Button>
              <button
                type="button"
                onClick={() => setItems(null)}
                className="text-xs font-semibold text-ink-secondary underline hover:text-ink"
              >
                Back
              </button>
              {saveState.error ? (
                <span role="alert" className="text-sm text-error-ink">
                  {saveState.error}
                </span>
              ) : null}
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
