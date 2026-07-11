import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Load Supabase URL + publishable key from the web app's local env so the
// integration tests can authenticate as the seeded fixture users. In CI without
// these vars, the RLS suite skips itself (see rls.test.ts).
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../apps/web/.env.local") });
