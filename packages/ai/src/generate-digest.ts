// Daily Triage Digest (AI_Integrations_Spec §1.5). One of the three PASSIVE
// features: no save step, dismiss-only, counsellor-internal, never shown to a
// student.
//
// Grounding rule (CLAUDE.md §4): the facts below come from real SQL detection
// (see lib/digest.ts). Gemini ONLY phrases already-true facts into friendly
// prose — it must never invent a number, a name, or an item.

import { generate } from "./client";

export interface DigestItem {
  /** A real, pre-detected fact, e.g. "3 tasks are pending your confirmation". */
  fact: string;
  /** Optional student names tied to that fact (already fetched). */
  students?: string[];
}

const SYSTEM = [
  "You write a college counsellor's short daily triage digest.",
  "You are given a list of ALREADY-TRUE facts detected from their caseload data.",
  "Rules:",
  "- Phrase ONLY the facts given. Never invent, infer, or add numbers, names, urgency, or advice not present in the facts.",
  "- One short, plain-language line per fact. Warm but efficient; no greeting, no sign-off.",
  "- Keep the student names exactly as given.",
  "- Return a JSON array of strings (one line per fact), in the same order.",
  "- Never use an em dash (—) in a line; use a period or comma instead.",
].join("\n");

/**
 * Phrase pre-detected triage facts into digest lines. With no facts, returns a
 * grounded all-clear WITHOUT calling the model. Returns the raw facts as a
 * fallback if the model/JSON fails, so the digest never goes blank or invents.
 */
export async function generateDigest(items: DigestItem[]): Promise<string[]> {
  if (items.length === 0) {
    return ["You're all caught up. Nothing needs your attention right now."];
  }

  const factLines = items.map((it, i) => {
    const names = it.students?.length ? ` (students: ${it.students.join(", ")})` : "";
    return `${i + 1}. ${it.fact}${names}`;
  });

  const prompt = [
    "Turn each of these facts into one short digest line. Return ONLY a JSON array of strings.",
    "",
    ...factLines,
  ].join("\n");

  let raw: string;
  try {
    raw = await generate({ prompt, system: SYSTEM, temperature: 0.3, json: true });
  } catch {
    return items.map((it) => it.fact); // grounded fallback: the raw facts
  }

  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((x) => typeof x === "string")
    ) {
      return parsed as string[];
    }
  } catch {
    /* fall through */
  }
  return items.map((it) => it.fact);
}
