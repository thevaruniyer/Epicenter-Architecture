"use client";

const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-yellow";

// Plain free-text field for the onboarding steps (hobbies / intended major /
// extracurriculars) — Stage 10 removed the AI "Suggest tags" affordance that
// briefly lived here; the student just types directly, no AI touches
// onboarding input anywhere.
export function OnboardingTagField({
  name,
  label,
  placeholder,
  defaultValue,
  multiline = true,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-ink">
      {label}
      {multiline ? (
        <textarea
          name={name}
          rows={4}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={fieldClass}
        />
      ) : (
        <input
          name={name}
          type="text"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={fieldClass}
        />
      )}
    </label>
  );
}
