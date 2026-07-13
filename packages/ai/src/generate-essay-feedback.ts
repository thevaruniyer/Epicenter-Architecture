// Essay Feedback First Pass (AI_Integrations_Spec §1.9). Draft-then-approve, but
// with a specific twist (CLAUDE.md §4): the AI badge is COUNSELLOR-SIDE ONLY —
// once the counsellor saves their reviewed feedback, the student never sees an
// AI marker on it. This function is only ever called server-side for the
// counsellor's Review & Feedback panel.
//
// Scope: OBSERVATIONS ONLY — structure, clarity, pacing. Never a judgement on
// the essay's content/argument, and never a rewritten version of the essay.

import { generate } from "./client";

const SYSTEM = [
  "You are giving a college counsellor a first-pass set of observations on a student's essay draft.",
  "Cover ONLY: structure, clarity, and pacing.",
  "Strict rules:",
  "- Do NOT judge the content, argument, or the student's story/choices.",
  "- Do NOT rewrite, rephrase, or produce any version of the essay text.",
  "- Give 3–5 concise, concrete observations as short bullet points (use '- ').",
  "- Neutral, constructive, specific to what you see. No score, no greeting, no sign-off.",
  "- This is a draft the counsellor will edit before it reaches the student; keep it as notes, not a letter.",
].join("\n");

/**
 * Produce a first-pass feedback draft (structure/clarity/pacing observations)
 * for a counsellor to edit. Throws on model failure so the caller can surface a
 * friendly error and let the counsellor write feedback manually.
 */
export async function generateEssayFeedback(essayText: string): Promise<string> {
  const prompt = [
    "Give your first-pass observations on this essay draft.",
    "",
    "--- ESSAY DRAFT ---",
    essayText,
    "--- END ESSAY DRAFT ---",
  ].join("\n");

  const out = await generate({ prompt, system: SYSTEM, temperature: 0.3 });
  return out.trim();
}
