import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { StudentSidebar } from "@/components/student/student-sidebar";
import { StudentTopbar } from "@/components/student/student-topbar";
import { PageTransition } from "@/components/shared/page-transition";

// Student app shell. Stage 8 Prompt 8.5, flagged Doctrine exception: now uses
// the same persistent-sidebar grid pattern as apps/web/app/counsellor/
// layout.tsx, reversing Doctrine §18.2's "simpler, not the counsellor's
// persistent sidebar" distinction — a deliberate product call.
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/counsellor/dashboard");

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 p-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden md:block">
          <StudentSidebar email={user.email} />
        </div>
        <div className="flex min-w-0 flex-col">
          <StudentTopbar />
          <main className="min-w-0 px-6 pb-16">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
