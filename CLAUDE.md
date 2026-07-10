# CLAUDE.md — Epicenter Education

This file is the entry point for any Claude Code session working in this repo. Read it first, every session. It tells you what this project is, what already exists, what the non-negotiable rules are, and — most importantly — what phase to build in and what "done" means for each phase. Don't skip ahead to a later phase's screens before an earlier phase's exit criteria are met.

**Working style, every session:** operate in Caveman mode by default (terse output, code/commands/errors unaffected) — see `MCP_and_Skills_Setup_Guide_v1.md` for the skill itself. Refresh Graphify's index at the end of every stage, not just once. Sentry gets verified (not just installed) at the end of every stage too, from Stage 0 onward. All three are production-readiness standards for this build, not optional habits — see `Product Context/Build_Runbook_v1.md` for exactly where each applies.

## 1. What this is

Epicenter Education is a college-counselling platform for a single pilot school: 3 counsellors, roughly 100 Grade 11/12 students. Counsellors manage caseloads — meeting notes, a roadmap of milestones/tasks, college shortlists, and application tracking. Students see their own roadmap, notes, shortlist, and application status, and complete some of their own data entry (onboarding, evidence uploads, update notes) that used to sit entirely on the counsellor. A layer of AI features (Gemini-backed) assists both sides without ever acting unsupervised — every AI output is either a draft a human confirms, or a passive/dismissible signal, never a final action taken on its own.

This is a real pilot, not a prototype for its own sake — real student data, real counsellor workflows, a small number of real users who need this to actually work.

## 2. Source-of-truth document map

Read these in this order of authority when something is ambiguous — later items win when they conflict with earlier ones on the same point:

1. `Product Context/Epicenter_Education_PRD_v1.md` — problem, users, use cases, goals/non-goals, permission matrix.
2. `Product Context/AI_Integrations_Spec_v1.md` + `AI_Integration_Flow_Plan_v1.md` — every AI feature's exact trigger, input data, and output behavior.
3. `Information Architecture/01_Information_Architecture_V1.html` + `02_Information_Architecture_Explanation.md` — original nav/sitemap thinking. **Partially superseded** — predates Forms, My Calendar, onboarding, and all AI features.
4. `User Flows/10_Counsellor_Flows_Full_PRD_Chronological_v3.html` and `11_Student_Flows_Full_PRD_Chronological_v3.html` — **the definitive source of truth for screen structure, fields, and flow sequence.** If a screen isn't in one of these two files, it is not in scope. When in doubt about a field, a button, or an interaction, open these files and look. **Their original inline colors/fonts/surfaces are superseded by item 5 below — never port their CSS.**
5. `UI-UX Doctrine/Epicenter_Education_UIUX_Doctrine_V1_Final.html` — **the definitive source of truth for everything visual**: colors, typography, spacing, surfaces, motion, glassmorphism, component states, accessibility, and role-specific (Counsellor/Student/Admin) experience rules. Epicenter Yellow `#EDC001` / white `#FDFDFD` / black `#000000`, Satoshi typeface. This doctrine **wins outright** over the storyboards' original visual styling — that supersession is total, not partial. It does not override the storyboards' approved screen order without a Product Owner decision.
6. `UI Inspiration/` — **mandatory, active** visual reference library (Doctrine §3.2). Before building any screen, open the closest matching file here, build against its composition/spacing/density, then re-open and compare after the first pass. Guides layout and interaction rhythm only — re-skin everything in Doctrine tokens, never the reference's original colors. Login and Onboarding are fidelity-reference pages — replicate the closest example closely.
7. `Product Context/Epicenter_Education_Architecture_v1.md` — the technical translation of all of the above into a real system: data model, permission model (RLS), AI implementation notes, screen-by-screen build manifest, repo structure, build phases, and the full Doctrine-to-Tailwind token mapping (§0). **This is the primary technical reference — read it in full before writing code.**
8. `Product Context/MCP_and_Skills_Reference_v1.md` + `MCP_and_Skills_Setup_Guide_v1.md` — every dev-tool MCP and Claude Code Skill in use, why, and exactly when to install each.

## 3. Confirmed tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (React + TypeScript) |
| Backend | Node.js/TypeScript, same repo |
| Database / BaaS | Supabase (Postgres + Auth + Storage + Row-Level Security) |
| Auth | Custom email/password via Supabase Auth for the pilot. Microsoft Entra ID SSO is a defined later milestone (Phase 7) — `users.entra_id` is already reserved as a nullable column so this migration doesn't require a data-model rewrite. |
| Hosting | Vercel |
| File storage | Supabase Storage now; Microsoft OneDrive/Graph API is Phase 7 |
| LLM | Google Gemini 2.5 Flash, server-side only, behind `packages/ai/lib/ai/client.ts` |
| Multi-tenancy | Single-tenant for the pilot, no `school_id` yet |
| Testing | Full pyramid: Vitest (unit), integration against a seeded Supabase test project, Playwright (E2E) |
| Environments | Dev + Production only, no staging |
| UI library | Tailwind CSS + shadcn/ui (Radix primitives), themed from the **UI/UX Doctrine V1**'s tokens (Epicenter Yellow `#EDC001` / white `#FDFDFD` / black `#000000`, Satoshi) — not shadcn's default look, and not the storyboards' old CSS |
| Repo structure | Single monorepo (`apps/web`, `packages/ui`, `packages/db`, `packages/ai`, `packages/config`, `tests/e2e`) |

## 4. Non-negotiable rules

These are the things that, if gotten wrong, either break the pilot's trust or require a real rebuild. Check against these before merging anything that touches them.

- **Private vs. shared notes are enforced at the Postgres RLS layer, never just hidden in the UI.** A student must never be able to fetch a private note's content by any route, including a misconfigured API endpoint. The Playwright E2E test for this boundary is the single most important test in the app — it must exist before this feature ships, not after.
- **Tick-then-confirm, everywhere it applies.** Roadmap tasks and application requirements both follow: student marks done/uploads → status becomes "pending review" → counsellor explicitly confirms → only then does it become "complete." Never skip the confirmation step, even for what looks like a trivial task.
- **AI drafts, humans confirm — except three purely passive features.** Every AI output (clean-up, nudges, essay feedback, checklist extraction, meeting prep, reassignment snapshot, onboarding extraction) requires an explicit save/approve action before it's used anywhere else. The three exceptions — Daily Triage Digest, Risk Flagging, Stalled-Task Alerts — are read-only/dismissible, never "saved," and never surfaced to students (counsellor-internal only).
- **Grounding rule for AI text.** Any AI output that states a fact (a digest line, a risk flag, a stalled-task alert) must be generated from a real SQL/rule-based detection query, then phrased by Gemini — never let the model invent the underlying fact. Detection logic and phrasing are separate steps.
- **The AI visual marker is a minimal black `.ai-badge`** ("AI-assisted"/"AI-generated" label, sparkle icon, neutral surface — Doctrine §7.10/§35.7), **permanent, not a "pending" state** — once something is AI-touched and saved, the badge stays, except essay-feedback badges, which are counsellor-side only and never shown to the student once saved. **Corrects an earlier draft of this project**: any prior reference anywhere in this document set to a violet badge (`#6E62E5` / `#EFEBFC`) is wrong and superseded — the Doctrine is explicit that AI content should feel factual, not magical, and must not use a gradient, neon accent, or promotional color.
- **RLS-scoped context, always.** Any AI feature reading a `StudentContextBundle` must query through the same RLS-scoped connection as a normal request. Cross-student data leakage through an AI feature is a bug even if the model itself would refuse to recite it — it's a query-scoping bug, not a prompt bug.
- **All pop-up panels center on screen**, per the confirmed UI edit — this was an explicit fix from the storyboard-review round, don't regress it. Confirmation modals follow Doctrine §23 (lightweight for reversible actions, a stronger centred modal for deletion/reassignment/submission/high-impact AI content).
- **Every screen must trace back to one of the two v3 storyboard files for its structure, and to the UI/UX Doctrine for its visual treatment.** If you're building something not in `10_Counsellor_Flows...v3.html` or `11_Student_Flows...v3.html`, stop and check scope before continuing. If a screen's colors, typography, or surfaces don't match the Doctrine, it is not done — see Doctrine Part XIV's Design Review Checklist and §56 Definition of Done before calling any V1 screen complete.

## 5. Build Phases

Work through these in order. Each phase lists its goal, what to build (cross-reference the Screen-by-Screen Build Manifest in the architecture doc §6 for exact routes), which MCPs/skills should be active, and the exit criteria that mean the phase is actually done — not just "code exists," but "the non-negotiables in §4 hold for everything built in this phase."

### Phase 1 — Foundation
**Build:** Supabase Auth (email/password) wired up end-to-end (signup, login, session). Core data model + every RLS policy from architecture §2/§3, written and tested before any UI depends on them. `packages/ui` scaffolded on Tailwind + shadcn/ui, themed from the **UI/UX Doctrine's tokens** (port the Doctrine's colors, Satoshi typography, radius scale, semantic states, and glass tokens into `tailwind.config.ts` first — see architecture doc §0 for the exact block — before generating a single component; cross-check composition against `UI Inspiration/` per Doctrine §3.2). Monorepo structure itself (`apps/web`, `packages/*`, `tests/e2e`, CI skeleton).
**Tooling active:** Supabase MCP, shadcn MCP (once `components.json` exists), Playwright MCP, Context7 MCP, Semgrep MCP, Sequential Thinking MCP, `security-review`, `skill-creator`, and the three design-taste skills in use (`emil-design-eng`, `impeccable`, `taste-skill` — not the merged `design-taste` skill, which isn't installed) — active from the very first component so nothing needs a later retrofit. Deployment work uses the Vercel CLI, not an MCP.
**Exit criteria:** a logged-in user of each role (student/counsellor/head-of-counselling/admin) sees exactly the rows RLS says they should, verified by an actual test, not inspection. A handful of real shadcn-based components exist in `packages/ui` and visibly match the **Doctrine's** palette (Epicenter Yellow/white/black, Satoshi) — not the old storyboard palette.

### Phase 2 — Counsellor core
**Build:** the global shell (topbar + full sidebar nav, every item routes somewhere real), Students grid, Overview/Profile (with the expanded fields — extracurriculars, test scores), Meeting Notes tab (composer + shared/private list, no AI clean-up yet), Roadmap/Tasks tab (milestone/task list, +Add Task, no category/nudge yet) with full tick-then-confirm status machinery. Forms and My Calendar get real "Coming soon" stub pages here — on-brand, no dead links, no functionality yet — since the full features are a tentative addition (see §5's Calendar & Forms entry below), but the nav shouldn't have holes in it.
**Tooling active:** Playwright MCP (write E2E tests for Students grid, Profile editing, Meeting Notes, and the tick-then-confirm cycle as each gets built, not after), Context7 MCP.
**Exit criteria:** a counsellor can create a task, a student can mark it done (from Phase 3 once that exists) or you simulate the student side via test fixtures, and a counsellor confirming it is the only way it reaches "complete." Private notes are invisible to a student test account by RLS, verified by a passing E2E test. Every sidebar nav item routes to a real screen — either a built feature or a genuine stub, never a 404.

### Phase 3 — Student core
**Build:** Login → onboarding wizard (6 steps, plain form first — no AI extraction yet), Home dashboard (sparse first-run state + established state), My Profile, Roadmap (student side — mark-done/upload with real evidence thumbnails), Notes (shared-only view).
**Tooling active:** same as Phase 2, plus a11y-mcp — the onboarding wizard is the most form-heavy, most accessibility-sensitive flow in the app, worth auditing as it's built rather than after.
**Exit criteria:** a brand-new student account can complete the full onboarding wizard (or explicitly skip and resume later — both paths tested), lands on a correctly-sparse dashboard, and cannot see any private note or any other student's data.

### Phase 4 — Shortlist & Applications
**Build:** both sides of college shortlist (priorities/metrics capture, suggest-a-university, category/status pills) and Applications (convert-to-application, requirement lifecycle, tick-then-confirm for submissions, offer/decision states).
**Tooling active:** Playwright MCP, Semgrep MCP (several new write paths this phase, worth scanning).
**Exit criteria:** the full application lifecycle — preparing → submitted → interview/offer/rejection → accept/decline — works end to end for one seeded test student, with every status transition going through the correct tick-then-confirm gate.

### Phase 5 — AI layer
**Build:** wire Gemini into every `lib/ai/*` function — clean-up, category-aware nudge (+ async signal extraction job), onboarding tag extraction, daily digest, risk flagging, stalled-task alerts, essay feedback first pass, requirement checklist extraction, reassignment handoff snapshot, meeting prep briefing. Add one feature at a time against the now-stable non-AI product from Phases 1–4 — don't build two AI features in parallel without one fully working first.
**Tooling active:** Sequential Thinking MCP (comparing grounding/prompt approaches per feature before committing to one), Graphify (the codebase now has enough cross-file structure — `StudentContextBundle`/`student_signals`/`AIActionLog` relationships span many files — for a knowledge-graph query to actually save time over grepping).
**Exit criteria:** every AI feature follows the drafts-vs-passive split correctly (§4 above), every fact-stating feature is grounded in real SQL detection + Gemini phrasing (not Gemini invention), and the black `.ai-badge` marker (Doctrine §7.10 — not violet) appears everywhere it should and nowhere it shouldn't (essay feedback hidden from students specifically).

### Phase 6 — Team & Reassignment
**Build:** Head of Counselling's Team view (caseload bars), the reassignment panel, and the permanent AI-generated handoff summary card that appears on the receiving counsellor's view of a reassigned student.
**Tooling active:** no new tooling — same stack as Phases 2–4.
**Exit criteria:** reassigning a student updates `counsellor_caseloads` with a `reassigned_from` history, and the new counsellor sees a handoff snapshot generated from the actual prior notes/roadmap state, not a placeholder.

### Phase 7 — Later milestone (not part of the initial pilot build)
**Build:** Microsoft Entra ID SSO migration (replacing email/password — `users.entra_id` is the join key, already reserved), Microsoft OneDrive/Graph API storage migration (replacing Supabase Storage). Tackled together since both are Microsoft-tenant setup work.
**Tooling active:** revisit the Microsoft Graph/Entra ID MCP question at this point — deliberately not evaluated before now.
**Exit criteria:** existing email/password accounts map onto real school Entra ID identities without losing any data — budget a short spike specifically for this migration path before starting, since Entra ID tenant configuration varies school to school.

### Tentative addition (not scheduled, may implement) — Calendar & Forms
**Build:** My Calendar (month/week views, optional Google Calendar connect + two-way sync toggles, Prep Notes), Forms feature (all three creation paths: native, Microsoft Forms embed, Google Forms embed). Originally Phase 6 — pulled out entirely, not just deprioritized, after the Google Calendar MCP registration failed with `HTTP 404` during real setup.
**Before resuming this:** verify a working Google OAuth setup in `MCP_and_Skills_Setup_Guide_v1.md` first — the documented endpoint didn't work as written, so this needs re-validation, not just re-running the same commands.
**Exit criteria (once built):** a counsellor can create a form via any of the three paths and a student can respond to it in-app; Google Calendar sync (when connected) reflects both directions correctly without duplicating events.

Chrome DevTools MCP, GitHub MCP, and Sentry MCP aren't tied to a specific phase — bring each in the moment its trigger condition is met (a running app to profile, the repo hosted on GitHub, Sentry wired in), per the setup guide.

## 6. Data model, permissions, AI implementation — see architecture doc

The full schema (every table and field), the complete RLS policy breakdown by role, and the AI abstraction-layer design are in `Product Context/Epicenter_Education_Architecture_v1.md` §2–§4. Don't re-derive these from the storyboards — the architecture doc has already done that translation. Treat it as authoritative for anything schema- or permission-related.

## 7. MCPs & Skills

Full install commands live in `Product Context/MCP_and_Skills_Setup_Guide_v1.md` — everything in it (apart from the explicitly deferred list) is installed already, in one sitting, not phase-gated. Short version: every dev-tooling MCP and the three design-taste skills in use (`emil-design-eng`, `impeccable`, `taste-skill`) are already active. Deployment goes through the Vercel CLI, not an MCP. The merged `design-taste` skill isn't installed — if the three skills disagree, default to `emil-design-eng`. The one thing that genuinely can't be set up yet is the custom Epicenter-conventions skill (needs real code first — moved up to **Stage 2** of the Build Runbook once Doctrine tokens, tick-then-confirm, and the RLS boundary all exist as real code, rather than waiting until Stage 5). Google Calendar MCP and the Google Workspace/Forms MCP are pulled from active use — the Calendar MCP's documented endpoint returned `HTTP 404` on real setup, so both are parked with the tentative Calendar & Forms addition until re-validated.

## 8. Testing expectations

Every phase above should leave behind real tests, not just working code: Vitest unit tests for permission/status-transition logic, integration tests against the seeded Supabase test project, and a Playwright E2E test for every major screen or flow built in that phase — not just the flagship ones. Two remain the highest-value tests in the whole app and are never optional: the private/shared note visibility boundary (Phase 3) and the AI drafts-vs-passive split (Phase 5). Beyond those two, `Product Context/Build_Runbook_v1.md` spells out exactly which E2E test goes with which screen, phase by phase.

Sentry is wired in Stage 0 of the Build Runbook and verified — not just assumed working — at the end of every single stage from Stage 0 onward: trigger the test error route, confirm the Sentry MCP shows it landed. Graphify's index gets refreshed at the end of every stage too, for the same reason: a snapshot taken once in Phase 5 goes stale the moment Phase 6 adds code.

## 9. Known open items

- Entra ID tenant configuration will vary by school — Phase 7 needs a dedicated spike before the migration itself.
- Sentry, GitHub Actions, and the dev/production-only environment split were added as sensible defaults during architecture planning, not explicitly requested — revisit if the pilot's needs change.
- Google Calendar and Forms (all three creation paths) are no longer part of the initial build — moved to the tentative addition after the Google Calendar MCP's documented endpoint returned `HTTP 404` on real setup. Google Forms API access needs its own OAuth consent screen, separate from the Calendar integration's — budget setup time for both, ideally together, whenever the tentative addition is actually picked up.
- The Tailwind + shadcn/ui UI library choice was inferred from the confirmed MCP/skill toolchain rather than asked directly — flagged in the architecture doc §10, confirm if a different foundation is actually wanted before Phase 1 component work goes too far to easily change.
- **Resolved, no longer open**: visual identity. The UI/UX Doctrine V1 (9 July 2026) is the binding source of truth for every color, typeface, spacing, surface, and interaction-quality decision across the whole product, fully replacing the storyboards' original inline CSS. Any document, prompt, or component built before this resolution that still references the old terracotta/rose/teal palette or the violet AI badge is stale and should be corrected on sight.
