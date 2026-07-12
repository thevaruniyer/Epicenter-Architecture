import { ClipboardList } from "lucide-react";
import { StubPage } from "@/components/counsellor/stub-page";

// Tentative feature — genuine "Coming soon" stub (no functionality, no Google OAuth).
export default function CounsellorFormsPage() {
  return (
    <StubPage
      icon={ClipboardList}
      badge="Coming soon"
      title="Forms"
      message="Creating and sending forms (native, Microsoft Forms, and Google Forms) is a later addition to the build. There's nothing to do here yet."
    />
  );
}
