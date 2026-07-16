import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/counsellor/sidebar";
import { Topbar } from "@/components/counsellor/topbar";
import { PageTransition } from "@/components/shared/page-transition";

// Counsellor app shell (Doctrine §18.1): persistent sidebar + topbar, staff-only.
export default async function CounsellorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  // Staff-only area. Students are routed to their own experience (Stage 3).
  if (user.role === "student") redirect("/app");

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, cta_label, cta_href, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 p-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden md:block">
          <Sidebar role={user.role} email={user.email} />
        </div>
        <div className="flex min-w-0 flex-col">
          <Topbar notifications={notifications ?? []} />
          <main className="min-w-0 px-6 pb-16">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
