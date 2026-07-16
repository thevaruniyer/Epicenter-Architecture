// Risk Flagging (AI_Integrations_Spec §1.6). One of the three PASSIVE features:
// dismiss-only, counsellor-internal, NEVER shown to a student. A nudge to look
// closer, never a verdict.
//
// Grounding rule (CLAUDE.md §4): the trigger facts come from real SQL detection
// (see lib/risk-flags.ts). Gemini ONLY phrases the already-true facts — it never
// decides whether something is risky or invents numbers.

import { generate } from "./client";

export type RiskType = "grade_drop" | "pace_lag";

const SYSTEM = [
  "You phrase a single, calm risk-flag sentence for a college counsellor about ONE student.",
  "You are given already-detected facts. Rules:",
  "- Phrase ONLY the given facts. Never invent numbers, never add a verdict or a recommendation.",
  "- One short sentence. Neutral and factual, a nudge to look closer, not an alarm.",
  "- No greeting, no student advice, no sign-off. Return plain text (no quotes).",
  "- Never use an em dash (—) in the sentence; use a comma instead.",
].join("\n");

/**
 * Phrase a grounded risk-flag sentence from detected facts. `facts` is a small
 * object already assembled by the detection query (e.g. milestone title, % due,
 * % complete). Falls back to a plain rendering of the facts if the model fails.
 */
export async function generateRiskFlag(
  type: RiskType,
  facts: Record<string, string | number>,
): Promise<string> {
  const factText = Object.entries(facts)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const prompt = [
    `Risk type: ${type}`,
    "Facts:",
    factText,
    "",
    "Write the one-sentence flag.",
  ].join("\n");

  try {
    const out = await generate({ prompt, system: SYSTEM, temperature: 0.2 });
    return out.trim();
  } catch {
    // Grounded fallback — never blank, never invented.
    if (type === "pace_lag") {
      return `${facts.milestone ?? "A milestone"} is behind pace: ${facts.expected_pct ?? "?"}% of tasks are due but ${facts.actual_pct ?? "?"}% are complete.`;
    }
    return "Grades have dropped across two consecutive checkpoints.";
  }
}
