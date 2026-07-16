// AI Note Clean-Up (AI_Integrations_Spec §1.1 counsellor, §2.5 student).
// Draft-then-approve: this produces a DRAFT only — a human reviews and explicitly
// saves before it becomes the stored note. Never fabricates or changes facts.

import { generate } from "./client";

export type CleanUpMode = "meeting" | "update";

// Counsellor meeting notes: reshape scattered points into a clear, structured
// record — grammar, ordering, light headings — WITHOUT changing what was said.
const MEETING_SYSTEM = [
  "You are an editor tidying a college counsellor's raw meeting notes into a clear, readable record.",
  "Rules:",
  "- Fix grammar, spelling, and punctuation; organise scattered points into a clear structure (short paragraphs or bullet points where natural).",
  "- Preserve every fact exactly. Do NOT invent details, names, dates, or conclusions that are not in the raw text.",
  "- Do not add commentary, greetings, or a summary the counsellor did not write.",
  "- Keep it concise and professional.",
  "- Never use an em dash (—) in your output; use a period, comma, or separate sentence instead.",
].join("\n");

// Student updates: a short note, not a formal record — tidy grammar/clarity only,
// keep the student's own voice, do NOT restructure into meeting-note formatting.
const UPDATE_SYSTEM = [
  "You are lightly tidying a student's short update note to their counsellor.",
  "Rules:",
  "- Fix only grammar, spelling, and clarity. Keep the student's own voice and wording as much as possible.",
  "- Do NOT restructure it into headings or bullet points; it stays a short, natural message.",
  "- Do NOT add content, facts, or a summary the student did not write.",
  "- Keep it roughly the same length.",
  "- Never use an em dash (—) in your output; use a period, comma, or separate sentence instead.",
].join("\n");

/**
 * Return a cleaned-up DRAFT of a note. The caller shows this to the human for
 * review and only saves it on explicit approval. Throws if the model fails (the
 * caller surfaces a friendly error and keeps the raw draft intact).
 */
export async function cleanUpNote(
  raw: string,
  mode: CleanUpMode,
): Promise<string> {
  const system = mode === "meeting" ? MEETING_SYSTEM : UPDATE_SYSTEM;
  const label = mode === "meeting" ? "meeting notes" : "student update";
  const prompt = [
    `Clean up the following ${label}.`,
    "Return ONLY the cleaned text. No preamble, no explanation, no surrounding quotes.",
    "",
    "--- RAW ---",
    raw,
    "--- END RAW ---",
  ].join("\n");

  const out = await generate({ prompt, system, temperature: 0.2 });
  return out.trim();
}
