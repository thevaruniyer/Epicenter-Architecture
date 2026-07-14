"use client";

import { usePathname } from "next/navigation";

// Stage 6.5 Prompt 6.5.7: the one approved motion category (Doctrine §13.1)
// that genuinely didn't exist anywhere yet — a context-preserving fade on
// route change instead of an abrupt hard-cut. 200ms sits inside §13.2's
// page-level-transition budget (max 300ms), ease-out via tw-animate-css's
// default curve. `motion-reduce:animate-none` belt-and-suspenders on top of
// the global prefers-reduced-motion rule in globals.css.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      className="animate-in fade-in duration-200 ease-out motion-reduce:animate-none"
    >
      {children}
    </div>
  );
}
