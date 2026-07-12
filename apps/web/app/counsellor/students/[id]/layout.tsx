import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StudentTabs } from "@/components/counsellor/student-tabs";

// Student workspace shell (UC1 Screens 3–5, 8): header + tab nav. RLS gates
// access — a counsellor not assigned to this student gets a 404 (queries return
// nothing).
export default async function StudentWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: userRow }, { data: profile }] = await Promise.all([
    supabase.from("users").select("full_name, email").eq("id", id).maybeSingle(),
    supabase
      .from("student_profiles")
      .select("grade, intended_major")
      .eq("user_id", id)
      .maybeSingle(),
  ]);

  if (!userRow && !profile) notFound();

  const name = userRow?.full_name ?? userRow?.email ?? "Student";
  const sub = [
    profile?.grade ? `Grade ${profile.grade}` : null,
    profile?.intended_major ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/counsellor/students"
          className="inline-flex items-center gap-1 text-sm text-ink-secondary transition-colors hover:text-ink"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Students
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{name}</h1>
        {sub ? <p className="mt-1 text-sm text-ink-secondary">{sub}</p> : null}
      </div>

      <StudentTabs studentId={id} />

      <div>{children}</div>
    </div>
  );
}
