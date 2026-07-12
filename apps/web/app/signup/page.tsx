"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@epicenter/ui";
import { signUp, type AuthState } from "@/lib/actions/auth";
import { ROLE_LABELS, USER_ROLES } from "@/lib/roles";
import { AuthPanel } from "@/components/auth/auth-panel";

const initialState: AuthState = {};
const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-yellow";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <AuthPanel
      eyebrow="You can easily"
      headline="Get set up with your counselling workspace."
    >
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        Create an account
      </h1>
      <p className="mt-1 text-sm text-ink-secondary">
        Create a pilot account for Epicenter Education.
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
            Create password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className={fieldClass}
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
            className={fieldClass}
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

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink underline">
          Log in
        </Link>
      </p>
    </AuthPanel>
  );
}
