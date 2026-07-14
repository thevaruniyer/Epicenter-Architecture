import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { StudentNav } from "@/components/student/student-nav";
import { PageTransition } from "@/components/shared/page-transition";

// Student app shell (Doctrine §18.2). Students only.
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
      <StudentNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
