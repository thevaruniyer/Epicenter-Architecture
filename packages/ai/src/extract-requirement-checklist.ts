// Requirement Checklist Extraction (AI_Integrations_Spec §1.10). Draft-then-
// approve: the counsellor pastes a university's raw requirements text and gets a
// structured checklist to edit before saving as the application's requirements.
//
// Grounding rule (CLAUDE.md §4): only extract requirements the pasted text
// actually states. Never invent a requirement or a deadline.

import { generate } from "./client";

// Matches application_requirements.requirement_type.
export const REQUIREMENT_TYPES = [
  "essay",
  "transcript",
  "recommendation",
  "form",
  "other",
] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

export interface ExtractedRequirement {
  title: string;
  type: RequirementType;
}

const SYSTEM = [
  "You turn a university's pasted application-requirements text into a clean checklist.",
  "Each item has a short title (what the applicant must provide) and a type, one of:",
  "- essay (personal statement, supplemental essays)",
  "- transcript (academic transcripts / records)",
  "- recommendation (recommendation / reference letters)",
  "- form (application forms, financial forms)",
  "- other (anything genuinely not covered above, e.g. portfolio, interview)",
  "Rules:",
  "- Only extract requirements actually stated in the text. Never invent items or deadlines.",
  "- Keep each title short and concrete (e.g. 'Personal statement (4000 char max)', 'One academic reference').",
  "- Return an empty array if the text contains no clear requirements.",
  "- Never use an em dash (—) in a title; use a comma instead.",
].join("\n");

/**
 * Extract a requirement checklist from pasted text. Returns [] on model/parse
 * failure — the counsellor can always add requirements manually. Only items with
 * a valid type survive.
 */
export async function extractRequirementChecklist(
  text: string,
): Promise<ExtractedRequirement[]> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const prompt = [
    'Return ONLY a JSON array of objects shaped {"title": string, "type": string}.',
    "No prose, no markdown fences.",
    "",
    "--- REQUIREMENTS TEXT ---",
    trimmed,
    "--- END ---",
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

  const valid = new Set<string>(REQUIREMENT_TYPES);
  const out: ExtractedRequirement[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const title = (item as { title?: unknown }).title;
    const type = (item as { type?: unknown }).type;
    if (typeof title !== "string" || !title.trim()) continue;
    const t = typeof type === "string" && valid.has(type) ? type : "other";
    out.push({ title: title.trim().slice(0, 200), type: t as RequirementType });
  }
  return out;
}
