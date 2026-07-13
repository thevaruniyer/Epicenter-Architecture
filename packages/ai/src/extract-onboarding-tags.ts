// Onboarding tag extraction (AI_Integrations_Spec §2.3, confirmed feature).
// A student's free-text answer becomes structured tags/chips they can edit
// before confirming — draft-then-approve, never silently auto-filled.
// Grounded: only tags supported by what the student actually wrote.

import { generate } from "./client";

export type OnboardingField = "hobbies" | "major" | "extracurriculars";

const GUIDANCE: Record<OnboardingField, string> = {
  hobbies:
    "Extract each distinct hobby or interest as a short, clean tag (e.g. 'Photography', 'Competitive chess'). Split combined phrases into separate tags.",
  major:
    "Extract the intended field(s) of study as 1–3 short tags (e.g. 'Computer Science', 'Artificial Intelligence'). Do not add fields the student did not mention.",
  extracurriculars:
    "Extract each activity as one tag combining activity plus any role/duration the student gave, e.g. 'Robotics Club — Team Lead', 'Debate Team — 2 yrs'. One tag per activity.",
};

function systemFor(kind: OnboardingField): string {
  return [
    "You turn a student's free-text onboarding answer into a short list of clean tags for their profile.",
    GUIDANCE[kind],
    "Rules:",
    "- Only produce tags grounded in what the student wrote. Never invent activities, interests, or fields.",
    "- Keep each tag concise (a few words). Fix obvious spelling/casing.",
    "- Return an empty array if there is nothing meaningful to tag.",
  ].join("\n");
}

/**
 * Extract editable tags from a free-text onboarding answer. Returns [] on any
 * model/parse failure so the student can always fall back to their own text.
 */
export async function extractOnboardingTags(
  text: string,
  kind: OnboardingField,
): Promise<string[]> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const prompt = [
    "Return ONLY a JSON array of strings (the tags). No prose, no markdown fences.",
    "",
    "--- ANSWER ---",
    trimmed,
    "--- END ANSWER ---",
  ].join("\n");

  let raw: string;
  try {
    raw = await generate({
      prompt,
      system: systemFor(kind),
      temperature: 0.2,
      json: true,
    });
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

  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of parsed) {
    if (typeof item !== "string") continue;
    const tag = item.trim().slice(0, 80);
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
  }
  return out;
}
