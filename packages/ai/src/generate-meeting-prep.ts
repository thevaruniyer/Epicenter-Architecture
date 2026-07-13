// Meeting Prep Briefing (AI_Integrations_Spec §1.11 / Flow Plan §4.11). Pull-
// based: the counsellor opens it on demand from a meeting ("Prep Notes"), never
// auto-pushed (consistent with the PRD's no-notifications V1 non-goal). Cached
// per meeting-id so re-opening doesn't re-call the model.
//
// Grounding rule (CLAUDE.md §4): the bundle is assembled from real RLS-scoped
// queries (see lib/meeting-prep.ts). Gemini only summarises what it is given.

import { generate } from "./client";

export interface MeetingPrepContext {
  studentName: string;
  intendedMajor: string | null;
  openTasks: { title: string; status: string; due: string | null }[];
  recentNotes: string[];
  upcomingDeadlines: { label: string; date: string }[];
}

const SYSTEM = [
  "You write a college counsellor a short pre-meeting briefing so they walk in already caught up on one student.",
  "You are given the student's real data. Rules:",
  "- Use ONLY what is given. Never invent progress, concerns, or deadlines.",
  "- 3–5 short bullets: where things stand, what's open, what to raise in the meeting.",
  "- Practical and neutral. No greeting, no sign-off. Return plain text with '- ' bullets.",
].join("\n");

function fmt(ctx: MeetingPrepContext): string {
  const tasks = ctx.openTasks.length
    ? ctx.openTasks
        .map((t) => `  - ${t.title} [${t.status}${t.due ? `, due ${t.due}` : ""}]`)
        .join("\n")
    : "  (none)";
  const notes = ctx.recentNotes.length
    ? ctx.recentNotes.map((n) => `  - ${n}`).join("\n")
    : "  (none)";
  const deadlines = ctx.upcomingDeadlines.length
    ? ctx.upcomingDeadlines.map((d) => `  - ${d.label}: ${d.date}`).join("\n")
    : "  (none)";

  return [
    `Student: ${ctx.studentName}`,
    `Intended major: ${ctx.intendedMajor ?? "undecided"}`,
    "Open tasks:",
    tasks,
    "Recent notes:",
    notes,
    "Upcoming deadlines:",
    deadlines,
  ].join("\n");
}

/**
 * Generate a grounded pre-meeting briefing. Throws on model failure so the
 * caller can surface a friendly error and let the counsellor open the full
 * record instead.
 */
export async function generateMeetingPrep(
  ctx: MeetingPrepContext,
): Promise<string> {
  const prompt = ["Write the pre-meeting briefing.", "", fmt(ctx)].join("\n");
  const out = await generate({ prompt, system: SYSTEM, temperature: 0.3 });
  return out.trim();
}
