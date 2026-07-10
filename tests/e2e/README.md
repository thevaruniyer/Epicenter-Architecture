# tests/e2e — Playwright end-to-end specs

Home for the app's Playwright E2E suite. Populated stage by stage per the Build
Runbook — one spec per major screen/flow, not just the flagship paths.

The two highest-value, never-optional tests live here once their features exist:

- **Private/shared note visibility boundary** (Stage 3) — a student session must
  never see a private note by any route, including a direct API hit.
- **AI drafts-vs-passive split** (Stage 5) — draft-then-approve features require an
  explicit save; the three passive features are dismiss-only and never shown to students.

Playwright is configured and the first specs are added starting in Stage 2.
