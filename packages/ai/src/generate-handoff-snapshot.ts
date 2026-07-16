// Reassignment Handoff Snapshot (AI_Integrations_Spec §1.7 / Flow Plan §4.7).
// When a student is reassigned, the receiving counsellor gets a permanent
// AI-generated "where things stand" summary — built from the student's ACTUAL
// prior notes + roadmap/shortlist/application state, never a placeholder.
//
// Grounding rule (CLAUDE.md §4): the bundle below is assembled from real,
// RLS-scoped queries (see lib/handoff.ts). Gemini only summarises what it is
// given — it never invents history. Permanent once generated (confirmed).

import { generate } from "./client";

export interface HandoffContext {
  studentName: string;
  grade: number | null;
  intendedMajor: string | null;
  recentNotes: { visibility: "shared" | "private"; text: string }[];
  tasks: { title: string; status: string; due: string | null }[];
  shortlist: { university: string; category: string | null; status: string }[];
  applications: { university: string; status: string }[];
}

const SYSTEM = [
  "You write a concise handoff briefing for a college counsellor who is taking over a student from another counsellor.",
  "You are given the student's real data. Rules:",
  "- Summarise ONLY what the data shows. Never invent history, plans, or concerns not present.",
  "- Cover: where the student is overall, what's in progress, and what needs attention next.",
  "- 4–7 short sentences or bullets. Practical and neutral. This is a handoff, not an evaluation.",
  "- Private notes are included because both parties are counsellors; treat them as context, don't quote verbatim.",
  "- No greeting, no sign-off. Return plain text.",
  "- Never use an em dash (—) in your output; use a period, comma, or separate sentence instead.",
].join("\n");

function fmt(ctx: HandoffContext): string {
  const notes = ctx.recentNotes.length
    ? ctx.recentNotes
        .map((n) => `  - [${n.visibility}] ${n.text}`)
        .join("\n")
    : "  (none)";
  const tasks = ctx.tasks.length
    ? ctx.tasks
        .map((t) => `  - ${t.title} [${t.status}${t.due ? `, due ${t.due}` : ""}]`)
        .join("\n")
    : "  (none)";
  const shortlist = ctx.shortlist.length
    ? ctx.shortlist
        .map((s) => `  - ${s.university} [${s.category ?? "uncategorised"}, ${s.status}]`)
        .join("\n")
    : "  (none)";
  const apps = ctx.applications.length
    ? ctx.applications.map((a) => `  - ${a.university} [${a.status}]`).join("\n")
    : "  (none)";

  return [
    `Student: ${ctx.studentName}`,
    `Grade: ${ctx.grade ?? "unknown"}`,
    `Intended major: ${ctx.intendedMajor ?? "undecided"}`,
    "Recent notes:",
    notes,
    "Roadmap tasks:",
    tasks,
    "Shortlist:",
    shortlist,
    "Applications:",
    apps,
  ].join("\n");
}

/**
 * Generate a grounded handoff summary from the student's real context bundle.
 * Throws on model failure so the caller can retry rather than store a bad
 * snapshot (the snapshot is permanent once written).
 */
export async function generateHandoffSnapshot(
  ctx: HandoffContext,
): Promise<string> {
  const prompt = [
    "Write the handoff briefing for this student.",
    "",
    fmt(ctx),
  ].join("\n");

  const out = await generate({ prompt, system: SYSTEM, temperature: 0.3 });
  return out.trim();
}
