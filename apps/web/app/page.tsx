import { LandingHero } from "@/components/landing/landing-hero";

// Public landing. Real marketing/role-aware entry comes later; this just routes
// into the auth flow.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 text-center">
      <LandingHero />
    </main>
  );
}
