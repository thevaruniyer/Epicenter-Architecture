---
name: epicenter-conventions
description: >-
  Project conventions for Epicenter Education that are easy to get wrong and
  expensive to fix. Consult before building or reviewing ANY screen, status
  transition (task/application requirement), meeting/update note, or AI-marked
  content. Encodes three code-backed rules: (1) UI/UX Doctrine tokens + the black
  AI badge (never violet), (2) the reusable tick-then-confirm status machine, and
  (3) the private/shared note RLS boundary. Points at the real files.
---

# Epicenter Education — project conventions

Three non-negotiables (CLAUDE.md §4) that already exist as real, committed code.
Use these; do not re-derive or reinvent them per screen.

## 1. UI/UX Doctrine tokens + the black AI badge

- **Style only from Doctrine tokens.** They live in `apps/web/tailwind.config.ts`
  (the architecture §0 block) and load under Tailwind v4 via the `@config` bridge
  in `apps/web/app/globals.css`. Use token classes: `bg-yellow` (#EDC001 — primary
  actions/emphasis only, never big backgrounds/errors), `bg-paper`, `text-ink`,
  `text-ink-secondary`, `border-border-soft`, the semantic triplets
  (`bg-complete-bg` / `border-complete-border` / `text-complete-ink`, and
  `overdue` / `pending` / `reach` / `target` / `safety` / `error`), and the
  `glass` tokens. Satoshi is the only typeface. **Never** ship default shadcn
  styling, and never port the storyboards' terracotta/rose/teal palette.
- **The AI marker is a minimal BLACK badge** — use `AiBadge` from `@epicenter/ui`
  ("AI-assisted"/"AI-generated", sparkle, black surface). It is permanent once
  applied. **Never violet** (`#6E62E5` / `#EFEBFC` are superseded and banned).
  Cite Doctrine §7.10 / §35.7. Essay-feedback badges are counsellor-side only and
  hidden from students once saved.
- Shared primitives live in `packages/ui/src` (`Card`, `Button`, `StatusPill`,
  `AiBadge`, `Dialog`). All pop-up panels render **centered** (Doctrine §4/§23);
  the `Dialog` already does this — reuse it, don't hand-roll modals.

## 2. Tick-then-confirm status machine (reuse it)

- The reusable machine is `apps/web/lib/tick-then-confirm.ts`
  (`TickThenConfirmModel`, `canTransition`, `assertTransition`, `TASK_MODEL`,
  `REQUIREMENT_MODEL`). A student **ticks** an item into a pending-review state;
  only a counsellor **confirms** it to the terminal `complete` state.
- **Hard rule:** `complete` is reachable **only by a counsellor, only from the
  pending-review state** — never auto-completes, never by a student. `canTransition`
  enforces this as an invariant regardless of the per-state tables.
- The counsellor confirm action is `apps/web/lib/actions/roadmap.ts`
  (`confirmTask` — validates via the machine, sets `confirmed_by`/`confirmed_at`).
  Applications (Stage 4) reuse `REQUIREMENT_MODEL` — do NOT write a second machine.
- The DB backs this up: the `tasks_update_student` policy in
  `packages/db/migrations/0002_rls_policies.sql` forbids a student setting
  `status = 'complete'` or `confirmed_by`. App logic and RLS both hold the line.
- Unit tests: `apps/web/lib/tick-then-confirm.test.ts`. Add cases when extending.

## 3. Private/shared note RLS boundary (the #1 boundary)

- Note visibility is enforced at **Postgres RLS**, never by hiding in the UI. The
  `notes_select` policy in `packages/db/migrations/0002_rls_policies.sql` returns a
  student only their own `shared` notes — a private note is excluded in the
  `USING` clause, so **no route (page, API, or raw query) can return it** to a
  student.
- In UI, still gate private content to staff sessions **on top of** RLS (see
  `apps/web/app/counsellor/students/[id]/notes/page.tsx`) — belt and braces.
- Private notes get the Doctrine treatment: black border + lock icon.
- This boundary is covered by the single most important E2E test in the app
  (the private-note visibility test, Stage 3). Never weaken it.

## Stage 8 additions — two flagged, deliberate Doctrine exceptions

Both are product calls made explicitly in the Stage 8 Build Runbook section, not
accidents — do not "fix" either one back to strict Doctrine compliance without a
Product Owner decision, and log both as a formal Doctrine addendum once this
stage merges.

- **DigestCard's pink liquid-glass gradient** (`apps/web/components/counsellor/digest-card.tsx`).
  Contradicts Doctrine §7.10 ("no gradient for AI-assisted content"). The `AiBadge`
  marker itself is unaffected and stays the standard black badge — only the card
  surface got the gradient.
- **AttentionListCard's "review" tone** (`apps/web/components/counsellor/attention-list-card.tsx`).
  Reuses the existing `target-*` tokens (Doctrine's Target-university blue) for a
  second, unrelated meaning — "awaiting your review" on the counsellor Dashboard —
  rather than inventing a new colour token.

## When in doubt

Authority order (later wins): PRD → AI specs → v3 storyboards (structure/fields)
→ UI/UX Doctrine (all visuals) → architecture doc (`Product Context/
Epicenter_Education_Architecture_v1.md`, §2 schema / §3 RLS / §6 screens). If a
screen isn't in a v3 storyboard, it's out of scope — stop and check.
