// Stalled-Task Alerts (AI_Integrations_Spec §1.8). One of the three PASSIVE
// features: dismiss-only, counsellor-internal, never shown to a student.
//
// Grounding rule (CLAUDE.md §4): the task title and the number of days stalled
// come from real SQL detection (see lib/stalled-tasks.ts). Gemini only phrases
// those facts.

import { generate } from "./client";

const SYSTEM = [
  "You phrase a single, neutral one-line alert that a student's task has been waiting for the counsellor's review too long.",
  "Rules:",
  "- Use ONLY the task title and the number of days given. Invent nothing else.",
  "- One short sentence, plain and factual. No greeting, no advice, no sign-off. Return plain text (no quotes).",
  "- Never use an em dash (—) in the sentence; use a comma instead.",
].join("\n");

/**
 * Phrase a grounded stalled-task line from the task title and days stalled.
 * Falls back to a plain template if the model fails — never blank, never
 * invented.
 */
export async function generateStalledAlert(
  taskTitle: string,
  daysStalled: number,
): Promise<string> {
  const prompt = [
    `Task title: ${taskTitle}`,
    `Days waiting in pending review: ${daysStalled}`,
    "",
    "Write the one-sentence stalled alert.",
  ].join("\n");

  try {
    const out = await generate({ prompt, system: SYSTEM, temperature: 0.2 });
    return out.trim();
  } catch {
    return `"${taskTitle}" has been awaiting your review for ${daysStalled} days.`;
  }
}
