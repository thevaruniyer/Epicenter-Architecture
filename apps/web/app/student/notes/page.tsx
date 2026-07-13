import { AiBadge } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import { AddUpdate } from "@/components/student/add-update";

type Note = {
  id: string;
  type: string;
  final_text: string | null;
  ai_cleaned: boolean;
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function StudentNotesPage() {
  const supabase = await createClient();
  // RLS returns only this student's SHARED notes — private notes can never be
  // fetched here (the #1 boundary).
  const { data } = await supabase
    .from("notes")
    .select("id, type, final_text, ai_cleaned, created_at")
    .order("created_at", { ascending: false });

  const notes = (data as Note[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
          Notes
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Notes</h1>
      </div>

      <AddUpdate />

      {notes.length === 0 ? (
        <p className="text-sm text-ink-tertiary">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-border-soft bg-surface-raised p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-ink">
                  {formatDate(n.created_at)}
                </span>
                <span className="text-xs capitalize text-ink-secondary">
                  {n.type === "student_update" ? "Your update" : "Meeting"}
                </span>
                {n.ai_cleaned ? <AiBadge /> : null}
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink">
                {n.final_text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
