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
  the `Dialog` already does this — reuse it, don't hand-roll modals. **Two
  Stage 9 exceptions, both Product Owner-confirmed, both positional by
  necessity — see below**: the Notifications panel and the product tour's
  coach-mark callout. Don't add a third non-centered panel without the same
  confirmation.

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

## Stage 8 additions — three flagged, deliberate Doctrine exceptions

All three are product calls made explicitly in the Stage 8 Build Runbook section,
not accidents — do not "fix" any of them back to strict Doctrine compliance
without a Product Owner decision, and log all three as a formal Doctrine
addendum once this stage merges.

- **DigestCard's pink liquid-glass gradient** (`apps/web/components/counsellor/digest-card.tsx`).
  Contradicts Doctrine §7.10 ("no gradient for AI-assisted content"). The `AiBadge`
  marker itself is unaffected and stays the standard black badge — only the card
  surface got the gradient.
- **AttentionListCard's "review" tone** (`apps/web/components/counsellor/attention-list-card.tsx`).
  Reuses the existing `target-*` tokens (Doctrine's Target-university blue) for a
  second, unrelated meaning — "awaiting your review" on the counsellor Dashboard —
  rather than inventing a new colour token.
- **Student shell's persistent left sidebar** (`apps/web/components/student/student-sidebar.tsx`,
  `apps/web/components/student/student-topbar.tsx`, `apps/web/app/student/layout.tsx`).
  Reverses Doctrine §18.2's documented distinction that the student shell is
  "simpler ... not the counsellor's persistent professional sidebar" — the
  student shell now uses the exact same grid/sidebar/topbar pattern as the
  counsellor shell (built directly from `apps/web/components/counsellor/sidebar.tsx`
  and `topbar.tsx`). `student-nav.tsx` (the old top pill-nav) was deleted; nothing
  else referenced it.

## Stage 9 additions — two non-centered panels, and the focus-trap pattern for both

- **Notifications panel** (`apps/web/components/shared/notification-bell.tsx`).
  The confirmed, sole CLAUDE.md §4 exception on record before this stage: a
  right-edge floating panel anchored to the Bell icon, not a centered `Dialog`.
  Shared between both shells via one component; only the icon-button classes
  passed by the caller differ.
- **Product tour coach-mark** (`apps/web/components/shared/product-tour.tsx`).
  A second non-centered panel, added this stage — inherently positional (it
  points at the sidebar item or widget it's explaining), so centering it would
  defeat the pattern. Reusable spotlight/cutout engine, driven by per-role
  step content in `apps/web/lib/tour-steps.ts`; targets are marked with a
  `data-tour="..."` attribute on the element to spotlight. Completion is
  persisted server-side (`apps/web/lib/actions/product-tour.ts`,
  `product_tour_completed_at` on `student_profiles`/`users`) the moment the
  tour mounts, not when the user finishes it — so a refresh mid-tour never
  restarts it.
- **`useFocusTrap`** (`apps/web/lib/use-focus-trap.ts`). Both panels above are
  non-modal floating dialogs (no dimming backdrop stealing all interaction, or
  in the tour's case a backdrop that's still `aria-hidden`), so keyboard focus
  can drift into the page behind them unless trapped. Reuse this hook — pass
  it the panel's ref and its open/closed boolean — for any future non-centered
  or non-`Dialog` floating panel; pair with an Escape handler and focusing the
  panel container on open (both existing panels do all three).

## When in doubt

Authority order (later wins): PRD → AI specs → v3 storyboards (structure/fields)
→ UI/UX Doctrine (all visuals) → architecture doc (`Product Context/
Epicenter_Education_Architecture_v1.md`, §2 schema / §3 RLS / §6 screens). If a
screen isn't in a v3 storyboard, it's out of scope — stop and check.
