"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@epicenter/ui";
import { signIn, type AuthState } from "@/lib/actions/auth";
import { AuthPanel } from "@/components/auth/auth-panel";

const initialState: AuthState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-yellow";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <AuthPanel
      eyebrow="Welcome back"
      headline="Your college journey, organised in one place."
    >
      <h1 className="text-2xl font-bold tracking-tight text-ink">Log in</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        Sign in to continue to Epicenter Education.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Your email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            required
            className={fieldClass}
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
            className={fieldClass}
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-error-ink">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-secondary">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-ink underline">
          Sign up
        </Link>
      </p>
    </AuthPanel>
  );
}
