"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/lib/actions/auth";
import { ROLE_LABELS, USER_ROLES } from "@/lib/roles";

const initialState: AuthState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-border-soft bg-surface-raised p-8 shadow-glass">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Sign up</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Create a pilot account.
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
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="role" className="text-sm font-medium text-ink">
              Role{" "}
              <span className="font-normal text-ink-tertiary">
                (pilot testing only)
              </span>
            </label>
            <select
              id="role"
              name="role"
              defaultValue="student"
              required
              className="w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-error-ink">
              {state.error}
            </p>
          ) : null}
          {state.message ? (
            <p role="status" className="text-sm text-ink-secondary">
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-yellow px-4 py-2.5 font-bold text-ink transition hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
