"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/lib/actions/auth";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-border-soft bg-surface-raised p-8 shadow-glass">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Log in
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Welcome back to Epicenter Education.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-error-ink">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-yellow px-4 py-2.5 font-bold text-ink transition hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-secondary">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-ink underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
