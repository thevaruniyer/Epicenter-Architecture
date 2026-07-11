import { defineConfig } from "vitest/config";

// Unit tests for pure logic in apps/web (e.g. role/permission helpers).
// Component/integration tests are handled elsewhere (tests/integration, tests/e2e).
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
