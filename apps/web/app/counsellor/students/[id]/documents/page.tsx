import { EssayReviewPanel } from "@/components/counsellor/essay-review-panel";

// Documents tab. Full document upload/versioning is not modelled yet; the
// Essay Feedback First Pass (§1.9) lives here — the counsellor pastes a draft
// and gets AI observations to edit before saving.
export default async function StudentDocumentsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-4">
      <EssayReviewPanel studentId={id} />
    </div>
  );
}
