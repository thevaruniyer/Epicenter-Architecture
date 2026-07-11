import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(here, "../../apps/web");
// Make Supabase URL/key available to the test process (for fixture setup that
// acts as seeded users through the Supabase client).
loadEnv({ path: resolve(webDir, ".env.local") });
const PORT = 3100;

// E2E runs against a production build of apps/web. Requires apps/web/.env.local
// (Supabase URL/key, Sentry DSN) and the seeded fixtures in the dev project.
export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `./node_modules/.bin/next build && ./node_modules/.bin/next start -p ${PORT}`,
    cwd: webDir,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
