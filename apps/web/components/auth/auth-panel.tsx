import Link from "next/link";
import { Sparkles } from "lucide-react";

// Split-panel auth shell (fidelity reference: UI Inspiration/User Log In Ref.jpg)
// re-skinned in Doctrine tokens: left = Epicenter-yellow brand panel with a
// headline at the foot; right = the form. Login and Onboarding share this rhythm.
export function AuthPanel({
  eyebrow,
  headline,
  children,
}: {
  eyebrow: string;
  headline: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-paper p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-border-soft bg-surface-raised shadow-glass md:min-h-[560px] md:grid-cols-2">
        <div className="relative hidden flex-col justify-between p-8 text-ink md:flex bg-[radial-gradient(circle_at_25%_15%,#FFE88A,transparent_60%),linear-gradient(155deg,#EDC001,#F6D652)]">
          <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-7 place-items-center rounded-md bg-ink text-white">
              <Sparkles className="size-4" aria-hidden />
            </span>
            EPICENTER.
          </Link>
          <div>
            <p className="text-sm font-semibold text-ink/70">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-balance">
              {headline}
            </h2>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-10">{children}</div>
      </div>
    </main>
  );
}
