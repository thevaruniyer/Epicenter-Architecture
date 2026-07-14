"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  id: string;
  group: "Students" | "Notes" | "Applications" | "Roadmap" | "Shortlist";
  label: string;
  meta?: string;
  href: string;
};

const MIN_LENGTH = 2;
const LIMIT_PER_GROUP = 5;

// Role-scoped search (Prompt 6.5.6). Every query below is RLS-scoped through
// the normal per-request Supabase client — a counsellor's results are
// automatically their own caseload, a student's are automatically their own
// records, the same boundary every other screen in the app already relies on.
export async function searchCounsellor(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < MIN_LENGTH) return [];
  const supabase = await createClient();

  const [{ data: students }, { data: notes }, { data: applications }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email")
      .eq("role", "student")
      .ilike("full_name", `%${q}%`)
      .limit(LIMIT_PER_GROUP),
    supabase
      .from("notes")
      .select("id, final_text, student_id, users:student_id(full_name)")
      .ilike("final_text", `%${q}%`)
      .limit(LIMIT_PER_GROUP),
    supabase
      .from("applications")
      .select("id, student_id, shortlist_entries!inner(university_name), users:student_id(full_name)")
      .ilike("shortlist_entries.university_name", `%${q}%`)
      .limit(LIMIT_PER_GROUP),
  ]);

  const results: SearchResult[] = [];

  for (const s of (students as { id: string; full_name: string | null; email: string }[] | null) ?? []) {
    results.push({
      id: `student-${s.id}`,
      group: "Students",
      label: s.full_name ?? s.email,
      href: `/counsellor/students/${s.id}`,
    });
  }

  for (const n of (notes as
    | { id: string; final_text: string | null; student_id: string; users?: { full_name: string | null } | null }[]
    | null) ?? []) {
    results.push({
      id: `note-${n.id}`,
      group: "Notes",
      label: (n.final_text ?? "").slice(0, 60),
      meta: n.users?.full_name ?? undefined,
      href: `/counsellor/students/${n.student_id}/notes`,
    });
  }

  for (const a of (applications as
    | {
        id: string;
        student_id: string;
        shortlist_entries: { university_name: string } | { university_name: string }[];
        users?: { full_name: string | null } | null;
      }[]
    | null) ?? []) {
    const entry = Array.isArray(a.shortlist_entries) ? a.shortlist_entries[0] : a.shortlist_entries;
    results.push({
      id: `application-${a.id}`,
      group: "Applications",
      label: entry?.university_name ?? "Application",
      meta: a.users?.full_name ?? undefined,
      href: `/counsellor/students/${a.student_id}/applications`,
    });
  }

  return results;
}

export async function searchStudent(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < MIN_LENGTH) return [];
  const supabase = await createClient();

  const [{ data: notes }, { data: tasks }, { data: shortlist }] = await Promise.all([
    supabase.from("notes").select("id, final_text").ilike("final_text", `%${q}%`).limit(LIMIT_PER_GROUP),
    supabase.from("tasks").select("id, title").ilike("title", `%${q}%`).limit(LIMIT_PER_GROUP),
    supabase
      .from("shortlist_entries")
      .select("id, university_name")
      .ilike("university_name", `%${q}%`)
      .limit(LIMIT_PER_GROUP),
  ]);

  const results: SearchResult[] = [];

  for (const n of (notes as { id: string; final_text: string | null }[] | null) ?? []) {
    results.push({
      id: `note-${n.id}`,
      group: "Notes",
      label: (n.final_text ?? "").slice(0, 60),
      href: "/student/notes",
    });
  }

  for (const t of (tasks as { id: string; title: string }[] | null) ?? []) {
    results.push({
      id: `task-${t.id}`,
      group: "Roadmap",
      label: t.title,
      href: "/student/roadmap",
    });
  }

  for (const s of (shortlist as { id: string; university_name: string }[] | null) ?? []) {
    results.push({
      id: `shortlist-${s.id}`,
      group: "Shortlist",
      label: s.university_name,
      href: "/student/shortlist",
    });
  }

  return results;
}
