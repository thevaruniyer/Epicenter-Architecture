import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client (for Client Components). Uses the publishable
// ("anon") key; all access is governed by Row-Level Security.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
