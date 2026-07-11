import { GraduationCap } from "lucide-react";
import { StubPage } from "@/components/counsellor/stub-page";

// Placeholder — the cross-caseload Applications Centre is built in Stage 4.
export default function CounsellorApplicationsPage() {
  return (
    <StubPage
      icon={GraduationCap}
      title="Applications Centre"
      message="Tracking applications across your caseload is built in a later stage."
    />
  );
}
