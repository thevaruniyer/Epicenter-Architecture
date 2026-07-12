import { NotebookPen } from "lucide-react";
import { StubPage } from "@/components/counsellor/stub-page";

// Placeholder — per-student Meeting Notes are built in Stage 2.4; a cross-caseload
// Internal Notes view is a later addition.
export default function CounsellorNotesPage() {
  return (
    <StubPage
      icon={NotebookPen}
      title="Internal Notes"
      message="Your notes live on each student's workspace. A combined view across your caseload is a later addition."
    />
  );
}
