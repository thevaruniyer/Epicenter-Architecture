import Link from "next/link";

// Public landing. Real marketing/role-aware entry comes later; this just routes
// into the auth flow.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 text-center">
      <div>
        <p className="text-lg font-semibold tracking-tight text-ink-secondary">
          Epicenter.
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">
          Let&rsquo;s all be on the same page
        </h1>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink-tertiary">
          The AI LMS built for counsellors and students
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-yellow px-5 py-2.5 font-bold text-ink transition hover:brightness-95"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-border-strong bg-surface-raised px-5 py-2.5 font-semibold text-ink transition hover:bg-surface-muted"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
