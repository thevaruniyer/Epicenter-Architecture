import { EssayReviewPanel } from "@/components/counsellor/essay-review-panel";
import { DocumentListCard, type DocumentRow } from "@/components/counsellor/document-list-card";
import { createClient } from "@/lib/supabase/server";

const IMAGE_EXT = ["png", "jpg", "jpeg", "webp"];

function kindFor(ext: string | undefined): DocumentRow["kind"] {
  if (ext === "pdf") return "pdf";
  if (ext && IMAGE_EXT.includes(ext)) return "image";
  return "other";
}

// Documents tab: a real chronological, searchable list of the student's
// uploaded documents (public.documents, storage bucket "documents") with a
// glassmorphic viewer, most recent first. The Essay Feedback First Pass
// (§1.9) stays below it as a secondary section — not extended by this list.
export default async function StudentDocumentsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("documents")
    .select("id, storage_path, uploaded_at")
    .eq("owner_id", id)
    .order("uploaded_at", { ascending: false });

  const docs = (rows as { id: string; storage_path: string; uploaded_at: string }[]) ?? [];

  const signedByPath = new Map<string, string>();
  if (docs.length) {
    const { data: signed } = await supabase.storage
      .from("documents")
      .createSignedUrls(
        docs.map((d) => d.storage_path),
        3600,
      );
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
    }
  }

  const documents: DocumentRow[] = docs.map((d) => {
    const filename = d.storage_path.split("/").pop() ?? d.storage_path;
    const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : undefined;
    return {
      id: d.id,
      filename,
      uploadedAtLabel: new Date(d.uploaded_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      signedUrl: signedByPath.get(d.storage_path) ?? null,
      kind: kindFor(ext),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <DocumentListCard documents={documents} />
      <EssayReviewPanel studentId={id} />
    </div>
  );
}
