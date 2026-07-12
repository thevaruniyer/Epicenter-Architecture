import { Sparkles } from "lucide-react";

// Onboarding split-panel (fidelity reference: UI Inspiration/Onboarding Ref 1-5.png)
// re-skinned in Doctrine tokens: left = Epicenter-yellow brand panel; right = one
// question per screen with a progress indicator. The "Previous Page" back link and
// the field live in the step form (children).
export function OnboardingShell({
  step,
  totalSteps,
  children,
}: {
  step: number;
  totalSteps: number;
  children: React.ReactNode;
}) {
  const pct = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <main className="grid min-h-screen bg-paper md:grid-cols-2">
      <div className="relative hidden flex-col justify-between p-10 text-ink md:flex bg-[radial-gradient(circle_at_25%_20%,#FFE88A,transparent_60%),linear-gradient(160deg,#EDC001,#F6D652)]">
        <div className="inline-flex items-center gap-2 font-bold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-ink text-white">
            <Sparkles className="size-4" aria-hidden />
          </span>
          EPICENTER.
        </div>
        <div>
          <p className="text-sm font-semibold text-ink/70">Let&rsquo;s set you up</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-balance">
            A few quick questions to personalise your journey.
          </h2>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-secondary">
              Step {step + 1} of {totalSteps}
            </p>
            <div className="h-1.5 overflow-hidden rounded-pill bg-surface-muted">
              <div
                className="h-full rounded-pill bg-yellow transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
