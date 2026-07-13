import { unstable_cache } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { generateDigest, type DigestItem } from "@epicenter/ai";
import { createClient } from "@/lib/supabase/server";

// Daily Triage Digest detection (grounding rule, CLAUDE.md §4): every fact here
// is a real, RLS-scoped query over the counsellor's own caseload. Gemini only
// phrases these — it never invents. The RLS-scoped client means "counsellor's
// caseload" is enforced by Postgres, not by a WHERE we could forget.

type Row = { users?: { full_name: string | null } | null };

function names(rows: Row[] | null, max = 3): string[] {
  const out: string[] = [];
  for (const r of rows ?? []) {
    const n = r.users?.full_name;
    if (n && !out.includes(n)) out.push(n);
    if (out.length >= max) break;
  }
  return out;
}

async function detect(): Promise<DigestItem[]> {
  const supabase = await createClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000).toISOString();
  const sel = "student_id, users:student_id(full_name)";

  const [pending, overdue, suggestions, updates, requirements] =
    await Promise.all([
      supabase.from("tasks").select(sel).eq("status", "pending_review"),
      supabase
        .from("tasks")
        .select(sel)
        .lt("due_date", today)
        .neq("status", "complete"),
      supabase
        .from("shortlist_entries")
        .select(sel)
        .eq("status", "awaiting_review")
        .eq("suggested_by", "student"),
      supabase
        .from("notes")
        .select(sel)
        .eq("type", "student_update")
        .gte("created_at", threeDaysAgo),
      supabase
        .from("application_requirements")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted_awaiting_confirmation"),
    ]);

  const items: DigestItem[] = [];
  const plural = (n: number, s: string, p: string) => (n === 1 ? s : p);

  const pendingRows = (pending.data as Row[] | null) ?? [];
  if (pendingRows.length) {
    items.push({
      fact: `${pendingRows.length} ${plural(pendingRows.length, "task is", "tasks are")} pending your confirmation`,
      students: names(pendingRows),
    });
  }

  const reqCount = requirements.count ?? 0;
  if (reqCount) {
    items.push({
      fact: `${reqCount} application ${plural(reqCount, "requirement is", "requirements are")} awaiting your review`,
    });
  }

  const overdueRows = (overdue.data as Row[] | null) ?? [];
  if (overdueRows.length) {
    items.push({
      fact: `${overdueRows.length} ${plural(overdueRows.length, "task is", "tasks are")} overdue`,
      students: names(overdueRows),
    });
  }

  const suggestionRows = (suggestions.data as Row[] | null) ?? [];
  if (suggestionRows.length) {
    items.push({
      fact: `${suggestionRows.length} new university ${plural(suggestionRows.length, "suggestion is", "suggestions are")} awaiting review`,
      students: names(suggestionRows),
    });
  }

  const updateRows = (updates.data as Row[] | null) ?? [];
  if (updateRows.length) {
    items.push({
      fact: `${updateRows.length} student ${plural(updateRows.length, "update", "updates")} shared in the last 3 days`,
      students: names(updateRows),
    });
  }

  return items;
}

/**
 * Phrase the digest, cached per counsellor per detected fact-set so Gemini is
 * called at most once per hour for a given caseload state (architecture §4
 * once-per-session rate-limit intent), and re-phrased when the facts change.
 * Best-effort — never throws into the caller (a passive feature must never
 * break the dashboard it's displayed on).
 */
export async function getDigest(counsellorId: string): Promise<string[]> {
  try {
    const items = await detect();
    const cached = unstable_cache(
      async (payload: DigestItem[]) => generateDigest(payload),
      ["counsellor-digest", counsellorId],
      { revalidate: 3600 },
    );
    return await cached(items);
  } catch (err) {
    Sentry.captureException(err, { tags: { ai_feature: "digest" } });
    return [];
  }
}
