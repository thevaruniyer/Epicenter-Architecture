import { Eye, Lock } from "lucide-react";
import { AiBadge, cn } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { NoteComposer } from "@/components/counsellor/note-composer";

type NoteRow = {
  id: string;
  visibility: "shared" | "private";
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

export default async function StudentNotesTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  // Explicit UI guard on TOP of the RLS boundary: private notes render only for
  // staff sessions. (RLS already prevents a student from ever fetching them.)
  const canSeePrivate = user ? user.role !== "student" : false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id, visibility, type, final_text, ai_cleaned, created_at")
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  const notes = ((data as NoteRow[]) ?? []).filter(
    (n) => canSeePrivate || n.visibility === "shared",
  );

  return (
    <div className="flex flex-col gap-4">
      <NoteComposer studentId={id} />

      {notes.length === 0 ? (
        <p className="text-sm text-ink-tertiary">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => {
            const isPrivate = n.visibility === "private";
            return (
              <li
                key={n.id}
                className={cn(
                  "rounded-lg bg-surface-raised p-4",
                  isPrivate ? "border-2 border-ink" : "border border-border-soft",
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-ink">
                    {formatDate(n.created_at)}
                  </span>
                  <span className="text-xs capitalize text-ink-tertiary">
                    {n.type.replace("_", " ")}
                  </span>
                  {n.ai_cleaned ? <AiBadge /> : null}
                  <span
                    className={cn(
                      "ml-auto inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-bold",
                      isPrivate
                        ? "bg-ink text-white"
                        : "border border-border-strong bg-surface-muted text-ink-secondary",
                    )}
                  >
                    {isPrivate ? (
                      <>
                        <Lock className="size-3" aria-hidden /> Counsellor only
                      </>
                    ) : (
                      <>
                        <Eye className="size-3" aria-hidden /> Shared
                      </>
                    )}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink">
                  {n.final_text}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
