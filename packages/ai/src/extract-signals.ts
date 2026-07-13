// Signal extraction (AI_Integration_Flow_Plan §3, §4.3). A small async job runs
// whenever a meeting note is saved: it pulls short, tagged signals out of the
// note text and stores them in student_signals, each categorised by the task
// taxonomy. The category-aware nudge (§4.3) then reads that table directly —
// no live LLM call when a counsellor opens the +Add Task panel.
//
// Grounding rule (CLAUDE.md §4): only extract things actually stated in the
// note. Never invent a signal.

import { generate } from "./client";

// Matches the tasks.category CHECK constraint.
export const TASK_CATEGORIES = [
  "academic",
  "ec",
  "essay",
  "testing",
  "documents_admin",
  "other",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface ExtractedSignal {
  category: TaskCategory;
  tag: string;
}

const SYSTEM = [
  "You extract short, factual signals from a college counsellor's meeting note about one student.",
  "Each signal is a brief tag describing something concrete the note says about the student — a concern, interest, achievement, or to-do — that could inform a future task.",
  "Categorise each into exactly one of:",
  "- academic (grades, coursework, subjects)",
  "- ec (extracurriculars, achievements, activities)",
  "- essay (essays, personal statements, applications)",
  "- testing (SAT/ACT/AP/IB and other exams)",
  "- documents_admin (transcripts, forms, recommendation letters, deadlines, logistics)",
  "- other (anything genuinely not covered above)",
  "Rules:",
  "- Only extract what the note actually states. Never invent, infer beyond the text, or add generic advice.",
  "- Each tag is at most ~60 characters, plain and specific (e.g. 'stressed about the essay', 'physics grade dropped').",
  "- Return an empty array if the note contains nothing task-relevant.",
].join("\n");

/**
 * Extract categorised signals from a note. Returns [] on any parsing/model
 * issue — signal extraction is best-effort background enrichment and must never
 * break note saving. Only well-formed signals with a valid category survive.
 */
export async function extractSignals(
  noteText: string,
): Promise<ExtractedSignal[]> {
  const prompt = [
    'Return ONLY a JSON array of objects shaped {"category": string, "tag": string}.',
    "No prose, no markdown fences.",
    "",
    "--- NOTE ---",
    noteText,
    "--- END NOTE ---",
  ].join("\n");

  let raw: string;
  try {
    raw = await generate({ prompt, system: SYSTEM, temperature: 0.1, json: true });
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const valid = new Set<string>(TASK_CATEGORIES);
  const out: ExtractedSignal[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const category = (item as { category?: unknown }).category;
    const tag = (item as { tag?: unknown }).tag;
    if (typeof category !== "string" || !valid.has(category)) continue;
    if (typeof tag !== "string" || !tag.trim()) continue;
    out.push({ category: category as TaskCategory, tag: tag.trim().slice(0, 80) });
  }
  return out;
}
