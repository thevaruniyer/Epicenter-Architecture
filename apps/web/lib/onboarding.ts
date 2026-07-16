// Student onboarding — 6 steps (SU1 Screens 2-8). Plain form only in Stage 3;
// AI tag extraction on the free-text steps lands in Phase 5.
export const ONBOARDING_STEPS = [
  {
    key: "age",
    question: "How old are you?",
    subtitle: "This helps us tailor guidance to you.",
  },
  {
    key: "grade",
    question: "What grade are you in?",
    subtitle: "Confirm what we have on file.",
  },
  {
    key: "subjects",
    question: "What subjects do you take?",
    subtitle: "Confirm or edit, one per line or comma-separated.",
  },
  {
    key: "hobbies",
    question: "What hobbies or interests do you have?",
    subtitle: "In your own words.",
  },
  {
    key: "major",
    question: "What's your intended major?",
    subtitle: "No preset list, however you'd describe it.",
  },
  {
    key: "extracurriculars",
    question: "What does your EC list look like?",
    subtitle: "Activities, roles, anything notable, one per line.",
  },
] as const;

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

// Split free text into a clean list (one per line or comma-separated).
export function splitList(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
