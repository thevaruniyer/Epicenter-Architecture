import { CalendarDays } from "lucide-react";
import { StubPage } from "@/components/counsellor/stub-page";

// Tentative feature — genuine "Coming soon" stub (no functionality, no Google sync).
export default function CounsellorCalendarPage() {
  return (
    <StubPage
      icon={CalendarDays}
      badge="Coming soon"
      title="My Calendar"
      message="Month/week views and optional Google Calendar sync are a later addition to the build. There's nothing to do here yet."
    />
  );
}
