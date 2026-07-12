import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";

// Minimal Home. The real sparse/established dashboard + skip-resume banner are
// built in the next prompt (Stage 3.3); this is the onboarding finish/skip target.
export default async function StudentHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/counsellor/dashboard");

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <div className="w-full max-w-md rounded-lg border border-border-soft bg-surface-raised p-8 text-center shadow-glass">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
          Epicenter Education
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
          Welcome{user.email ? "" : ""} 👋
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Your dashboard is being built. For now, you&rsquo;re all set.
        </p>
        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="rounded-md border border-border-strong bg-surface-raised px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-muted"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
