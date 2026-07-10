import { redirect } from "next/navigation";
import { getSessionUser, ROLE_LABELS } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";

// Blank authenticated shell. Role-specific surfaces (counsellor/student) are
// built from Stage 2 onward; this exists so signup → login → session works
// end to end and route guards have a real destination.
export default async function AppShellPage() {
  const user = await getSessionUser();
  // Belt-and-braces: middleware already redirects unauthenticated users.
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md rounded-lg border border-border-soft bg-surface-raised p-8 shadow-glass">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
          Epicenter Education
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
          You&rsquo;re signed in
        </h1>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-secondary">Email</dt>
            <dd className="font-medium text-ink">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-secondary">Role</dt>
            <dd>
              <span className="inline-flex items-center rounded-pill border border-border-strong bg-surface-muted px-3 py-1 text-xs font-bold text-ink">
                {ROLE_LABELS[user.role]}
              </span>
            </dd>
          </div>
        </dl>

        <form action={signOut} className="mt-8">
          <button
            type="submit"
            className="w-full rounded-md border border-border-strong bg-surface-raised px-4 py-2.5 font-semibold text-ink transition hover:bg-surface-muted"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
