import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { StubPage } from "@/components/counsellor/stub-page";

// Head of Counselling only. The Team view + reassignment are built in Stage 6.
export default async function CounsellorTeamPage() {
  const user = await getSessionUser();
  if (user?.role !== "head_of_counselling") redirect("/counsellor/dashboard");

  return (
    <StubPage
      icon={UsersRound}
      title="Team"
      message="Caseload overview and student reassignment are built in a later stage."
    />
  );
}
