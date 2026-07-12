"use client";

import { useState, useTransition } from "react";
import { Sparkles, X } from "lucide-react";
import { AiBadge, Button } from "@epicenter/ui";
import {
  suggestOnboardingTags,
  type TagState,
} from "@/lib/actions/onboarding";
import type { OnboardingField } from "@epicenter/ai";

const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-yellow";

// Draft-then-approve tag field for the free-text onboarding steps (§2.3). The
// student types freely, optionally asks AI to turn it into editable chips, then
// edits/confirms before the value is submitted with the step. Nothing is saved
// until they hit Next/Finish — and they can always fall back to plain text.
export function OnboardingTagField({
  name,
  kind,
  label,
  placeholder,
  defaultValue,
  multiline = true,
}: {
  name: string; // the form field the step action reads (hobbies / intended_major / extracurriculars)
  kind: OnboardingField;
  label: string;
  placeholder: string;
  defaultValue: string;
  multiline?: boolean;
}) {
  const [text, setText] = useState(defaultValue);
  const [tags, setTags] = useState<string[] | null>(null); // null = plain-text mode
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // How the confirmed value is serialised for the step action: major is a
  // single field (comma-joined); hobbies/ECs are lists (newline-joined).
  const joinTags = (list: string[]) =>
    kind === "major" ? list.join(", ") : list.join("\n");

  const hiddenValue = tags !== null ? joinTags(tags) : text;

  function suggest() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("text", text);
      fd.set("kind", kind);
      const res: TagState = await suggestOnboardingTags({}, fd);
      if (res.error) setError(res.error);
      else if (res.tags && res.tags.length) setTags(res.tags);
      else setError("No tags to suggest — your text is saved as-is.");
    });
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-medium text-ink">
      {label}
      {/* The submitted value — chips when confirmed, otherwise the raw text. */}
      <input type="hidden" name={name} value={hiddenValue} />

      {tags === null ? (
        multiline ? (
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className={fieldClass}
          />
        ) : (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className={fieldClass}
          />
        )
      ) : (
        <div className="flex flex-col gap-2 rounded-md border border-border-soft bg-surface-muted p-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
            <AiBadge /> Suggested — edit before you continue
          </span>
          <ul className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <li
                key={`${tag}-${i}`}
                className="inline-flex items-center gap-1 rounded-pill border border-border-strong bg-surface-raised py-1 pl-3 pr-1.5 text-sm font-normal text-ink"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => setTags(tags.filter((_, j) => j !== i))}
                  className="rounded-full p-0.5 text-ink-tertiary hover:bg-surface-muted hover:text-ink"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = newTag.trim();
                  if (t) setTags([...tags, t]);
                  setNewTag("");
                }
              }}
              placeholder="Add another…"
              className={`${fieldClass} text-sm font-normal`}
            />
            <button
              type="button"
              onClick={() => {
                setTags(null);
                setError(null);
              }}
              className="whitespace-nowrap text-xs font-semibold text-ink-secondary underline hover:text-ink"
            >
              Back to text
            </button>
          </div>
        </div>
      )}

      {tags === null ? (
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          onClick={suggest}
          disabled={pending || !text.trim()}
          className="w-fit font-semibold"
        >
          <Sparkles className="size-4" aria-hidden />
          {pending ? "Finding tags…" : "Suggest tags with AI"}
        </Button>
      ) : null}

      {error ? (
        <p role="status" className="text-xs text-ink-secondary">
          {error}
        </p>
      ) : null}
    </div>
  );
}
