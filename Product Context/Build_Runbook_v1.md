# Epicenter Education — Build Runbook v1

Every prompt you need to give Claude Code, in order, to build this app — organized into stages that map to the build phases in `CLAUDE.md` §5. Each stage is its own git branch, ends in a commit, a pushed PR, and a merge to `main` before the next stage starts — nothing moves to `main` without going through that gate.

**Production-readiness standards applied throughout this version:**
- **Caveman mode is on by default for the whole build.** Say "talk like caveman" (or just start — Caveman activates from message one once installed, per its own setup) at the start of your Claude Code session and leave it on; switch to "normal mode" only for a specific explanation-heavy moment if you need one.
- **Every stage ends with a Sentry verification step**, not just Stage 0's initial wiring — confirming errors are actually captured, not just that the SDK is present.
- **Every stage ends with a Graphify index refresh**, not just Stage 5 — the graph stays current with the codebase as it grows, not just snapshotted once.
- **Every major screen/flow gets its own Playwright E2E test**, not just the flagship critical-path ones — those two (private/shared note visibility, AI drafts-vs-passive split) are still explicitly called out as the highest-stakes, but they're no longer the only tests per stage.
- **Calendar & Forms gets real placeholder UI now**, in Stage 2 — nav items exist, routes render a genuine "Coming soon" state — while the actual Google-integrated functionality stays a tentative, undated addition at the end (see that section for why).
- **Every screen-building prompt requires UI/UX Doctrine compliance, not just Stage 0/1's token setup.** Stating this once at the top of a long multi-stage session is not enough on its own — a stale reference to the old storyboard colors or a generic shadcn default can slip in three stages later without anyone re-reading CLAUDE.md. So this is enforced twice: (1) before building any screen, open the closest file in `UI Inspiration/` and build against it, re-skinned in Doctrine tokens; (2) every stage's "End of stage" prompt below now includes an explicit Doctrine Design-Review-Checklist pass (Doctrine Part XIV) over everything built that stage, as a real gate before the PR opens — not optional, and not skippable because "it was probably fine."

Repo: `https://github.com/thevaruniyer/Epicenter-Architecture.git`

## 0. Git workflow discipline (applies to every stage below — read once)

- `main` is always the last known-good state. Nothing is committed straight to it.
- One branch per stage: `stage-0-bootstrap`, `stage-1-foundation`, `stage-2-counsellor-core`, `stage-3-student-core`, `stage-4-shortlist-applications`, `stage-5-ai-layer`, `stage-6-team-reassignment`, and (tentative, not scheduled) `stage-7-calendar-forms`.
- Inside a stage, commit after every numbered prompt below completes and the work is verified — not just once at the end of the whole stage. Each commit message should say what changed and reference the stage (e.g. `[stage-1] Add RLS policies for notes, tasks, applications`).
- At the end of a stage: run the full test suite, verify Sentry, refresh Graphify, push the branch, open a PR against `main`, review the diff yourself (or have Claude Code summarize it), merge, then pull `main` locally before branching for the next stage.
- If a stage's E2E tests fail after merge, that's a stop-the-line event — fix forward on a small hotfix branch before starting the next stage, don't build Stage N+1 on top of a broken `main`.

## 0.5 — Autonomous session kickoff prompt (for agentic tools like Mythos / Claude Code)

Paste the block below as the **first message of every session**, whether you're starting the build fresh or resuming one that stopped for any reason (ran out of context, you closed the tool, a PR was waiting on review). It's self-resuming by design: the agent re-derives "what's already done" from git history and the Runbook itself, never from its own memory of a prior session, which is what actually makes "keep working through the Runbook and come back to it" reliable across restarts — a promise made in chat isn't, a promise re-checked against `git log` every time is.

Within a stage it runs prompt-to-prompt on its own without you re-pasting each one. It hard-stops at every stage-end PR (per §0 above, you merge, not it) and at any prompt that explicitly asks it to report something back — those are the same human checkpoints already built into the Runbook, just enforced automatically instead of hoping the agent remembers to pause.

```
This is an ongoing multi-stage build. Read Product Context/Build_Runbook_v1.md and CLAUDE.md in full before doing anything else — every time you start or resume this session, not just the first time.

Then run `git log --oneline` on the current branch and on main. Every prompt in the Runbook ends in a commit formatted "[stage-N] <description>" — use that history, not your memory of a previous session, to work out exactly which prompts are already done and which one is next, in the exact order they appear in the Runbook, stage by stage. If a session got cut off mid-prompt, check the actual file/test state too, not just the last commit message, before deciding whether that prompt is really finished.

Once you know the next prompt: execute exactly what it says, nothing more and nothing less — don't combine it with the next one, don't skip ahead because you can guess what's coming. Commit with the exact message given in that prompt. Then immediately find the next prompt and keep going, without waiting for me to paste it in, unless one of these is true:
- It was an "End of stage" prompt. Stop there — push the branch, open the PR exactly as instructed, summarize the diff for me, and wait. Don't merge it yourself and don't start the next stage until I tell you the PR is merged.
- The prompt's own text asks you to report something back and wait (RLS policy summaries, Semgrep findings, the drafts-vs-passive audit, a Doctrine Design Review Checklist failure) — stop there too, even mid-stage.
- Something fails: a test, lint, typecheck, a Sentry check, or a Doctrine checklist item. Stop, tell me exactly what failed, and don't move on until it's actually fixed and passing — never mark a prompt done just to keep momentum going.

Give me a one-line status at the start of your response every time — which stage/prompt you're resuming at and how you determined that from git — before you start executing.
```

---

## Stage 0 — Repo bootstrap (before Phase 1 proper)

This stage exists because a few of the MCPs from the setup guide (shadcn MCP specifically) need a minimal scaffold to attach to, and because Sentry needs a real Next.js app to wire into before any feature code exists. If you already ran the equivalent shadcn step from the MCP setup guide, skip to Prompt 0.3.

**Prompt 0.1 — Clone and orient**
```
Clone https://github.com/thevaruniyer/Epicenter-Architecture.git if it isn't already local, and open this session in that directory. Read CLAUDE.md in full, then Product Context/Epicenter_Education_Architecture_v1.md in full, then skim the two v3 storyboard HTML files in User Flows/ so you have the actual screens/fields/flow in mind, then open UI-UX Doctrine/Epicenter_Education_UIUX_Doctrine_V1_Final.html in full and the UI Inspiration/ folder — the Doctrine is the binding visual source of truth (colors, typography, spacing, surfaces, components, accessibility) and fully replaces the storyboards' original inline CSS; the storyboards remain authoritative only for screen structure/fields/flow order. Don't write any code yet — just confirm back to me in a few sentences that you understand the project, the non-negotiable rules in CLAUDE.md §4, and that Phase 1 is next.
```

**Prompt 0.2 — Branch and scaffold**
```
Create and switch to a new branch called stage-0-bootstrap off the latest main. Scaffold the monorepo exactly as described in the architecture doc §8: apps/web (Next.js + TypeScript + Tailwind, App Router), packages/ui, packages/db, packages/ai, packages/config, tests/e2e, and .github/workflows/. Use pnpm workspaces. Don't add any business logic yet — this is structure only. Commit with message "[stage-0] Scaffold monorepo structure".
```

**Prompt 0.3 — shadcn + Doctrine design tokens + shadcn MCP**
```
Inside apps/web, initialize shadcn/ui yourself (run pnpm dlx shadcn@latest init) — this will default to Tailwind v4. Before generating any components, port the UI/UX Doctrine's tokens into tailwind.config.ts — use the exact block in Product Context/Epicenter_Education_Architecture_v1.md §0 (Epicenter Yellow #EDC001, surface-primary #FDFDFD, ink-primary #000000, the full neutral/semantic/radius/glass token set, Satoshi typography loaded via Fontshare) so every shadcn primitive inherits the Doctrine's actual look instead of shadcn's defaults. Because Tailwind v4 no longer auto-detects a JS/TS config file, add `@config "../../tailwind.config.ts";` (adjust the relative path to wherever the file actually lands) near the top of the CSS entry file, alongside the v4 baseline `@import "tailwindcss";`, so tailwind.config.ts keeps loading exactly as written — this is Tailwind's own supported v3-config bridge, not a workaround. Note that v4's JS-config bridge doesn't support the corePlugins, safelist, or separator options; irrelevant to the Doctrine token block itself, but don't reach for them later. Do not port anything from the v3 storyboard HTML files' original <style> blocks — that palette (terracotta/rose/teal) and the old violet AI-badge colors (#6E62E5/#EFEBFC) are explicitly superseded and must not appear anywhere in tailwind.config.ts. Confirm components.json now exists. Then register the shadcn MCP server yourself by running pnpm dlx shadcn@latest mcp init --client claude from inside apps/web, and confirm it's connected by listing the available shadcn components. Commit with message "[stage-0] Initialize shadcn/ui with UI/UX Doctrine design tokens (Tailwind v4 + @config bridge) and register shadcn MCP".
```

**Prompt 0.4 — Sentry SDK wiring**
```
Wire the Sentry Next.js SDK into apps/web — client config, server config, and edge config, per Sentry's official Next.js integration. Use the DSN from the Sentry project created during MCP setup, read from an environment variable, never hardcoded. Add a test-only route (e.g. /api/debug-sentry) that deliberately throws, purely so Sentry capture can be verified end-to-end in later stages — don't wire this into any real feature yet. Commit with message "[stage-0] Wire Sentry SDK with test error route".
```

**Prompt 0.5 — CI skeleton**
```
Add a GitHub Actions workflow at .github/workflows/ci.yml that runs lint, typecheck, and test steps (unit + integration, wired to actually run once those suites exist in later stages — empty/passing is fine for now) on every PR against main. Commit with message "[stage-0] Add CI skeleton".
```

**Prompt 0.6 — End of stage**
```
Run lint and typecheck locally to confirm everything passes. Hit the /api/debug-sentry route locally and confirm the error shows up in Sentry (ask the Sentry MCP to list issues and check for it) — this is the first Sentry verification of the build, every later stage repeats it. Open tailwind.config.ts and confirm it contains only UI/UX Doctrine tokens (Epicenter Yellow #EDC001, #FDFDFD, #000000, the full semantic/radius/glass set) and none of the old storyboard values — specifically confirm #6E62E5 and #EFEBFC do not appear anywhere in the file. Run /graphify to build the initial knowledge graph index over what exists so far. Push stage-0-bootstrap and open a PR against main titled "Stage 0: Repo bootstrap". Summarize the diff for me in plain language before I merge.
```
(Merge the PR yourself in GitHub once you're happy with it, then locally: `git checkout main && git pull`.)

---

## Stage 1 — Phase 1: Foundation

**Prompt 1.1 — Branch**
```
Checkout main, pull latest, and create a new branch stage-1-foundation.
```

**Prompt 1.2 — Supabase project + Auth**
```
Wire up Supabase Auth with email/password end-to-end: signup, login, session handling, and a logout flow, using the Supabase MCP against the project we created. Add role (admin/head_of_counselling/counsellor/student) to the session context so route guards can check it. Don't build any role-specific screens yet — just get a user able to sign up, log in, and see a blank authenticated shell. Commit with message "[stage-1] Wire up Supabase Auth email/password".
```

**Prompt 1.3 — Data model**
```
Using the Supabase MCP, write the full set of migrations for every table in Product Context/Epicenter_Education_Architecture_v1.md §2 — users, student_profiles, counsellor_caseloads, notes, roadmap_milestones, tasks, shortlist_entries, student_priorities, applications, application_requirements, documents, calendar_events, google_calendar_connections, forms, form_assignments, form_responses, student_signals, risk_flags, stalled_task_alerts, reassignment_snapshots, ai_action_log. Match every field and type exactly as specified. Apply the migrations to the dev Supabase project. Commit with message "[stage-1] Add full data model migrations".
```

**Prompt 1.4 — RLS policies**
```
This is the highest-stakes part of the whole build, per CLAUDE.md §4 — take it slowly. Write every RLS policy described in architecture §3: students can only read/update their own rows and explicitly cannot see notes where visibility = 'private'; counsellors get full CRUD only on rows where student_profiles.assigned_counsellor_id matches them; head of counselling gets read-across-caseloads plus write on counsellor_caseloads; admin gets write on users/student_profiles base fields only. Write these as actual SQL policies, not app-layer checks. When done, summarize each policy back to me in plain English so I can sanity-check the logic before we test it. Commit with message "[stage-1] Add RLS policies for all tables".
```

**Prompt 1.5 — RLS unit + integration tests**
```
Write Vitest unit tests for the RLS policy logic and integration tests against the seeded Supabase test project confirming: a student test account cannot fetch another student's data, a student test account cannot fetch a private note even via a raw query, and a counsellor test account cannot see another counsellor's caseload. Run them and show me the results — don't mark this done until they're all green. Commit with message "[stage-1] Add RLS permission tests".
```

**Prompt 1.6 — Shared UI components**
```
In packages/ui, build the first set of shared components per the UI/UX Doctrine (Part XII, Shared Design System): Card, Panel/Dialog (must render centered on screen, per CLAUDE.md §4 — not top-right; use the Doctrine's confirmation-strength rules for lightweight vs. stronger centred modals), Pill/status badge (Doctrine §7 semantic tokens — complete/overdue/pending/reach/target/safety, colour plus label plus icon, never colour alone), and the AI badge component (minimal black marker per Doctrine §7.10/§35.7 — "AI-assisted" label, sparkle icon, neutral surface, permanent once applied — explicitly NOT the violet #6E62E5/#EFEBFC treatment from an earlier draft of this project). Every primitive must inherit the Doctrine's Satoshi typography, radius scale, spacing, shadows, and focus states — default shadcn styling must not ship unchanged. Use the design-taste skills (impeccable, emil-design-eng, taste-skill) to review the animation/interaction details on these before committing — run a design review pass explicitly and tell me what it flagged. Commit with message "[stage-1] Add core shared UI components on UI/UX Doctrine tokens".
```

**Prompt 1.7 — End of stage**
```
Run the full test suite (unit + integration) and lint/typecheck. Run a Semgrep scan on everything touching auth and RLS specifically and tell me what it finds. Trigger the /api/debug-sentry route and confirm Sentry still captures it. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against every component built in Prompt 1.6 — confirm each uses Doctrine tokens (not shadcn defaults), the AI badge is the minimal black treatment (not violet), Panel/Dialog renders centered, and status pills use the Doctrine's semantic colour+label+icon combination, never colour alone. Fix anything that fails before continuing. Run /graphify to refresh the index now that the data model and RLS policies exist. Push stage-1-foundation and open a PR against main titled "Stage 1: Foundation". Summarize the diff, and specifically confirm the RLS test results and the Doctrine check before I review.
```
(Merge, then `git checkout main && git pull`.)

---

## Stage 2 — Phase 2: Counsellor Core

**Prompt 2.1 — Branch**
```
Checkout main, pull latest, create branch stage-2-counsellor-core.
```

**Prompt 2.2 — Global shell + Calendar/Forms placeholders**
```
Build the counsellor app's global shell per architecture §6: topbar (search, notifications, calendar, profile icons) and sidebar with every nav item — Dashboard, Students, Applications Centre, Internal Notes, Reports, Forms, My Calendar (Team instead of Students for Head of Counselling), using the Doctrine's fixed counsellor navigation shell (§18.1 — persistent sidebar, glass selected-state treatment). Every nav item must route somewhere real. For Forms and My Calendar specifically — which are tentative features, not part of this build yet — build /counsellor/forms and /counsellor/calendar as genuine "Coming soon" stub pages: on-brand per the UI/UX Doctrine (not the old storyboard palette), clearly stating the feature is coming in a later phase, with no broken links or dead ends. No Google OAuth, no functionality behind these two routes yet. Commit with message "[stage-2] Add global shell with full nav, Calendar/Forms as Coming Soon stubs".
```

**Prompt 2.3 — Students grid + Overview/Profile**
```
Build /counsellor/students (the student grid) and /counsellor/students/[id] Overview tab, per architecture §6 and UC1 Screens 2–5 and 8 in the counsellor storyboard. Include the expanded profile fields (extracurriculars & achievements, test scores & academic history) and the Edit Profile panel (centered, per the non-negotiable rule). Use seeded test data, not real students. Commit with message "[stage-2] Add Students grid and Overview/Profile tab".
```

**Prompt 2.4 — Meeting Notes tab**
```
Build the Meeting Notes tab per UC1 Screens 6–8: raw note composer, shared/private note list. No AI clean-up yet — that's Phase 5. Enforce that private notes only render for counsellor-role sessions in this UI, on top of the RLS boundary already in place. Commit with message "[stage-2] Add Meeting Notes tab".
```

**Prompt 2.5 — Roadmap/Tasks tab with tick-then-confirm**
```
Build the Roadmap/Tasks tab per UC2 Screens 3–11: milestone/task list and the +Add Task panel (no category selector or AI nudge yet — that's Phase 5). This is where the tick-then-confirm status machinery needs to be exactly right: not_started → in_progress → pending_review (student action) → complete (counsellor confirms explicitly — never auto-completes). Build this status machine as a reusable function/hook, not one-off per screen, since Applications will reuse the same pattern in Stage 4. Commit with message "[stage-2] Add Roadmap/Tasks tab with tick-then-confirm".
```

**Prompt 2.6 — E2E: Students grid and Profile editing**
```
Write a Playwright E2E test covering the Students grid (loads, shows seeded students, multi-select mode works) and the Overview/Profile tab (Edit Profile panel opens centered on screen, saves the expanded fields correctly, and the saved values actually persist and re-render). Commit with message "[stage-2] Add Students grid and Profile E2E test".
```

**Prompt 2.7 — E2E: Meeting Notes**
```
Write a Playwright E2E test covering the Meeting Notes tab: a counsellor composes and saves both a shared and a private note, and both appear correctly in the counsellor's own list (this test doesn't need to check student-side invisibility yet — that's the dedicated RLS test in Stage 3). Commit with message "[stage-2] Add Meeting Notes E2E test".
```

**Prompt 2.8 — E2E: tick-then-confirm cycle**
```
Write the Playwright E2E test for the tick-then-confirm cycle: simulate a student marking a task done (via test fixtures, since student screens don't exist until Stage 3), confirm it shows as pending_review, then have a counsellor test account confirm it, and verify it only becomes complete after that explicit action — never before. Run it and confirm it passes. Commit with message "[stage-2] Add tick-then-confirm E2E test".
```

**Prompt 2.9 — Epicenter-conventions skill (moved up from Stage 5)**
```
By this point, three real, code-backed conventions exist and won't meaningfully change: the UI/UX Doctrine's tokens and the black AI-badge rule (Stage 0-1), the tick-then-confirm status machinery (Prompt 2.5), and the RLS private/shared boundary (Stage 1.4-1.5). That's enough to stop deferring the custom skill — use skill-creator now, not at Stage 5, to author a project-specific Epicenter-conventions skill encoding: the UI/UX Doctrine's token names and the black AI-badge rule (never violet, cite Doctrine §7.10/§35.7), the tick-then-confirm pattern (point at the actual hook from Prompt 2.5), and the private/shared-note RLS boundary (point at the actual policies from Stage 1). The point of moving this earlier is so Stages 3 through 6 all get the reinforcement, not just Stage 6 under the old plan. Commit with message "[stage-2] Add Epicenter-conventions skill (Doctrine tokens, tick-then-confirm, RLS boundary)".
```

**Prompt 2.10 — End of stage**
```
Run the full test suite, lint, typecheck. Trigger the Sentry test route and confirm capture. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against every screen built this stage — global shell, Students grid, Overview/Profile, Meeting Notes, Roadmap/Tasks, and the Forms/Calendar stubs — confirming each was built against its closest `UI Inspiration/` reference, uses Doctrine tokens throughout, and that the counsellor navigation shell matches Doctrine §18.1 (persistent sidebar, glass selected state). Note which reference file was used for each screen. Fix anything that fails before continuing. Run /graphify to refresh the index. Push stage-2-counsellor-core and open a PR against main titled "Stage 2: Counsellor Core". Summarize the diff, confirm all three new E2E tests are in the suite and passing, and confirm the Doctrine check.
```
(Merge, then `git checkout main && git pull`.)

---

## Stage 3 — Phase 3: Student Core

**Prompt 3.1 — Branch**
```
Checkout main, pull latest, create branch stage-3-student-core.
```

**Prompt 3.2 — Login page + onboarding wizard (plain form)**
```
Build /login and the 6-step onboarding wizard per SU1 Screens 2–8 in the student storyboard: age, grade confirm, subjects confirm, hobbies (free text), intended major (free text, no preset list — per the confirmed decision), extracurriculars list (free text). Per UI/UX Doctrine §3.2, Login and Onboarding are fidelity-reference pages: open UI Inspiration/User Log In Ref.jpg, Onboarding Ref 1-5.png first, and build these screens as a close composition/interaction replication of those references (split-panel layout, one-question-per-screen progression, "Previous Page" back link) re-skinned entirely in Doctrine tokens (Epicenter Yellow/white/black, Satoshi) — not a generic login form or generic wizard that merely uses the right colors. Plain form only — no AI tag extraction yet, that's Phase 5. Make onboarding skippable and resumable (student_profiles.onboarding_current_step tracks this). Run an a11y-mcp audit on this flow specifically once built and fix anything it flags — this is explicitly the most form-heavy, most accessibility-sensitive screen in the app. Name which UI Inspiration reference files you used in the commit message. Commit with message "[stage-3] Add login page and student onboarding wizard, built from UI Inspiration fidelity references".
```

**Prompt 3.3 — Home dashboard + resume banner**
```
Build /student/home in both states — the sparse first-run dashboard (SU1 Screen 9) and the established-state dashboard (SU1 Screen 10) — plus the "onboarding was skipped" resume banner (SU1 Screen 11). Commit with message "[stage-3] Add student Home dashboard".
```

**Prompt 3.4 — My Profile, Roadmap, Notes (student side)**
```
Build /student/profile (SU2 — note that major/EC-list should render as pre-filled/AI-badged-once-Phase-5-lands, but for now just pre-filled from onboarding with no badge yet), /student/roadmap (SU3 — mark-done/upload with a real evidence thumbnail, not a placeholder icon, submitting into pending_review using the same status hook from Stage 2), and /student/notes (SU5 — shared notes only). Commit with message "[stage-3] Add student Profile, Roadmap, and Notes screens".
```

**Prompt 3.5 — E2E: onboarding wizard, full completion and skip/resume**
```
Write Playwright E2E tests covering both onboarding paths: a brand-new student completing all 6 steps end to end and landing on the sparse Home dashboard, and a student explicitly skipping onboarding, seeing the resume banner on Home, and resuming from the correct saved step. Commit with message "[stage-3] Add onboarding completion and skip/resume E2E tests".
```

**Prompt 3.6 — E2E: student Roadmap evidence upload**
```
Write a Playwright E2E test for the student-side Roadmap: mark a task done with an evidence upload, confirm the real thumbnail renders (not a placeholder icon), and confirm the task correctly enters pending_review status using the same hook tested from the counsellor side in Stage 2. Commit with message "[stage-3] Add student Roadmap evidence upload E2E test".
```

**Prompt 3.7 — The most important E2E test in the app**
```
Write the Playwright E2E test for the private/shared note visibility boundary: log in as a student test account and confirm that a private note authored by their counsellor never appears in the UI, never appears in any network response payload, and cannot be fetched by directly hitting the API route with the student's session. This needs to test the actual RLS boundary end-to-end, not just check the UI hides it. Run it and don't proceed until it passes. Commit with message "[stage-3] Add private/shared note visibility E2E test".
```

**Prompt 3.8 — End of stage**
```
Run the full test suite, lint, typecheck, and an a11y-mcp pass on the onboarding wizard one more time. Trigger the Sentry test route and confirm capture. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against every screen built this stage — specifically confirm Login and Onboarding pass the stricter fidelity-reference bar (Doctrine §3.2/§54): closely replicate the UI Inspiration login/onboarding examples' composition, not just use the right colors — and confirm the student navigation shell matches Doctrine §18.2 (simpler than counsellor, no persistent professional sidebar). Fix anything that fails before continuing. Run /graphify to refresh the index. Push stage-3-student-core and open a PR against main titled "Stage 3: Student Core". Summarize the diff and explicitly confirm the private-note E2E test and the Doctrine check are passing before I review.
```
(Merge, then `git checkout main && git pull`.)

---

## Stage 4 — Phase 4: Shortlist & Applications

**Prompt 4.1 — Branch**
```
Checkout main, pull latest, create branch stage-4-shortlist-applications.
```

**Prompt 4.2 — Shortlist (both sides)**
```
Build the College Shortlist feature on both sides per UC4 (counsellor) and SU4 (student): priorities/metrics capture ("what does the student want out of this list" fields — explicitly not fed into any matching algorithm, just displayed), Suggest a University (student side, no category selector), category/status pills (counsellor side). Commit with message "[stage-4] Add College Shortlist, counsellor and student sides".
```

**Prompt 4.3 — Applications (both sides)**
```
Build the Applications feature per UC5 (counsellor) and SU6/SU7 (student): convert-to-application flow, the application_requirements lifecycle (awaiting_student → submitted_awaiting_confirmation → needs_revision → complete, using the same tick-then-confirm hook from Stage 2), and the offer/decision states (offer_received, accept/decline). Commit with message "[stage-4] Add Applications, requirement lifecycle, and offer/decision states".
```

**Prompt 4.4 — E2E: Shortlist**
```
Write a Playwright E2E test for the Shortlist feature: a student suggests a university, it appears correctly on the counsellor side with the right status, and the counsellor can set its category (reach/target/safety) and status, with the change reflecting back correctly on the student side. Commit with message "[stage-4] Add Shortlist E2E test".
```

**Prompt 4.5 — Full lifecycle E2E test + security scan**
```
Write a Playwright E2E test that runs one seeded test student through the entire application lifecycle end to end: preparing → submitted → interview_requested → offer_received → accepted, confirming every status transition goes through the correct tick-then-confirm gate and never skips a step. Then run a Semgrep scan across everything added this stage, given how many new write paths this phase introduces. Commit with message "[stage-4] Add full application lifecycle E2E test".
```

**Prompt 4.6 — End of stage**
```
Run the full test suite, lint, typecheck. Trigger the Sentry test route and confirm capture. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against the Shortlist and Applications screens built this stage — status pills for reach/target/safety and the application lifecycle states use the Doctrine's exact semantic tokens (§7), the requirement lifecycle's status language matches Doctrine §29 (e.g. "Waiting for counsellor review", not a bare "Pending"), and each screen was checked against its closest `UI Inspiration/` reference. Fix anything that fails before continuing. Run /graphify to refresh the index. Push stage-4-shortlist-applications and open a PR against main titled "Stage 4: Shortlist & Applications". Summarize the diff, the Semgrep findings, and the Doctrine check before I review.
```
(Merge, then `git checkout main && git pull`.)

---

## Stage 5 — Phase 5: AI Layer

This is the largest stage — ten AI features, each behind its own function, added one at a time against the now-stable non-AI product. Don't parallelize these; finish and commit one before starting the next, exactly as CLAUDE.md §5 says.

**Prompt 5.1 — Branch + abstraction layer**
```
Checkout main, pull latest, create branch stage-5-ai-layer. Set up packages/ai/lib/ai/client.ts as the single entry point for all Gemini 2.5 Flash calls, server-side only, reading the API key from a Vercel environment variable that's never exposed client-side, per architecture §4. Don't add any feature functions yet — just the base client wrapper and a way to log every call to ai_action_log. Commit with message "[stage-5] Add Gemini client abstraction layer".
```

**Prompt 5.2 — AI Note Clean-Up**
```
Add cleanUpNote() to the AI abstraction layer and wire it into the Meeting Notes tab (counsellor) and the "Add an Update" flow (student, light version) from Product Context/AI_Integrations_Spec_v1.md §1.1 and §2.5. This is a draft-then-approve feature — the counsellor/student must explicitly save the cleaned version before it's used anywhere; the permanent AI badge only appears after that save. Log every call to ai_action_log. Commit with message "[stage-5] Add AI Note Clean-Up (counsellor + student)".
```

**Prompt 5.3 — Category-aware nudge + signal extraction**
```
Add the async signal-extraction job (writes to student_signals on note save) and extractSignals()/the nudge logic into the +Add Task panel, per AI_Integration_Flow_Plan_v1.md §4.3. The nudge reads student_signals directly — it should not call Gemini synchronously every time a counsellor opens the Add Task panel. Commit with message "[stage-5] Add category-aware task nudge and async signal extraction".
```

**Prompt 5.4 — Onboarding tag extraction**
```
Add extractOnboardingTags() and wire it into the onboarding wizard's hobbies/major/EC-list steps from Stage 3 — free text in, AI-suggested tags/chips out, student can edit before confirming. This is a draft-then-approve feature. Commit with message "[stage-5] Add onboarding AI tag extraction".
```

**Prompt 5.5 — Daily Triage Digest**
```
Add generateDigest() — SQL/rule-based detection of what belongs in the digest (per the grounding rule: real query first, Gemini only phrases it), phrased via a live Gemini call, rendered on the counsellor dashboard from Stage 2. This is one of the three passive/dismissible features — no save step, dismiss only, counsellor-internal, never shown to students. Commit with message "[stage-5] Add Daily Triage Digest".
```

**Prompt 5.6 — Risk Flagging**
```
Add the risk-flag detection query (grade drop across 2 checkpoints, 50% pace lag — per the thresholds in AI_Integrations_Spec_v1.md §3) plus generateRiskFlag() for phrasing, writing to risk_flags. Passive/dismissible, counsellor-internal only, same as the digest. Commit with message "[stage-5] Add Risk Flagging".
```

**Prompt 5.7 — Stalled-Task Alerts**
```
Add the stalled-task detection query (3-day stalled window) plus phrasing, writing to stalled_task_alerts, surfaced on the Roadmap tab from Stage 2. Passive/dismissible. Commit with message "[stage-5] Add Stalled-Task Alerts".
```

**Prompt 5.8 — Essay Feedback First Pass**
```
Add generateEssayFeedback(), auto-generating the moment a counsellor opens the Review & Feedback panel on the Documents tab (per your confirmed answer on when this triggers), cached per draft-version so re-opening doesn't re-call the model. This is counsellor-side only — no AI badge shown to the student once saved, per your confirmed decision. Commit with message "[stage-5] Add Essay Feedback First Pass".
```

**Prompt 5.9 — Requirement Checklist Extraction**
```
Add extractRequirementChecklist() and wire it into the Applications tab's Paste Requirements flow (UC5): counsellor pastes raw requirement text, gets back an editable extracted checklist with AI badges, saves it. Draft-then-approve. Commit with message "[stage-5] Add Requirement Checklist Extraction".
```

**Prompt 5.10 — Reassignment Handoff Snapshot**
```
Add generateHandoffSnapshot(), writing to reassignment_snapshots, generated from the actual prior notes/roadmap state of the reassigned student — not a placeholder. This one is permanent once generated, per the confirmed decision, and needs the reassignment flow from Stage 6 to fully exercise it — build the function and the display card now, and it'll get its trigger wired in during Stage 6. Commit with message "[stage-5] Add Reassignment Handoff Snapshot generation".
```

**Prompt 5.11 — Meeting Prep Briefing**
```
Add generateMeetingPrep(), triggered on-demand via a "Prep Notes" button (pull-over-push — never auto-pushed), cached per meeting-id. Note: the real Calendar screen this button normally lives on is a tentative, not-currently-scheduled addition (see the very end of this runbook) — for now, the Calendar route is just the "Coming soon" stub from Stage 2. Build the function and panel now regardless, and it'll get wired into the real Calendar UI whenever that's actually built. Commit with message "[stage-5] Add Meeting Prep Briefing generation".
```

**Prompt 5.12 — E2E: AI draft-then-approve UI flows**
```
Write Playwright E2E tests covering the draft-then-approve UI interactions specifically: opening the AI Note Clean-Up preview and confirming it only applies after explicit save, opening the Requirement Checklist Extraction panel and confirming the extracted checklist is editable before saving, and confirming the category-aware nudge renders correctly in the +Add Task panel. Commit with message "[stage-5] Add AI draft-then-approve E2E tests".
```

**Prompt 5.13 — AI drafts-vs-passive audit**
```
Go through all ten AI features just built and confirm each one follows the correct split from CLAUDE.md §4: seven require an explicit save/approve action before the output is used anywhere else, and three (Digest, Risk Flagging, Stalled-Task Alerts) are dismiss-only and never shown to students. Also confirm the AI badge appears everywhere it should and specifically does not appear on the student-facing essay feedback. Report back any violations before we commit. Once clean, commit with message "[stage-5] Audit AI drafts-vs-passive split and badge placement".
```

**Prompt 5.14 — Graphify refresh + skill update**
```
Run /graphify to build a knowledge graph over the codebase now that it has real cross-file structure (StudentContextBundle/student_signals/AIActionLog relationships span many files). The Epicenter-conventions skill already exists (authored back in Prompt 2.9) — open it and confirm it still accurately reflects the AI-badge rule, tick-then-confirm pattern, and RLS boundary now that the AI layer is built; update it via skill-creator only if something drifted (e.g. a new AI-badge placement convention worth encoding). Commit with message "[stage-5] Refresh Graphify index and verify Epicenter-conventions skill".
```

**Prompt 5.15 — End of stage**
```
Run the full test suite, lint, typecheck. Trigger the Sentry test route and confirm capture — also deliberately trigger a failure in one AI function (e.g. a malformed Gemini response) and confirm that surfaces in Sentry too, since AI-call failures are exactly the kind of silent failure this monitoring exists for. Run the UI/UX Doctrine's Design Review Checklist (Part XIV), with special attention to Part VIII (AI Experience, §35): confirm the black AI marker (never violet, never a gradient) appears on every draft-then-approve surface built this stage and is absent from the student-facing essay feedback specifically, confirm the three passive features (Digest, Risk Flagging, Stalled-Task Alerts) use dismissible surfaces rather than a save action, and confirm AI processing states show what's happening rather than a vague "Thinking…" spinner (Doctrine §35.8). Fix anything that fails before continuing. Push stage-5-ai-layer and open a PR against main titled "Stage 5: AI Layer". Summarize the diff and specifically confirm the drafts-vs-passive audit results and the Doctrine AI-marker check before I review.
```
(Merge, then `git checkout main && git pull`.)

---

## Stage 6 — Phase 6: Team & Reassignment

Calendar & Forms (originally combined into this stage) has been pulled out entirely and moved to the tentative section at the very end of this runbook — see "Tentative Addition" below. This stage is now just Team & Reassignment on its own; still small, but nothing left small enough to combine it with.

**Prompt 6.1 — Branch**
```
Checkout main, pull latest, create branch stage-6-team-reassignment.
```

**Prompt 6.2 — Team view + reassignment + handoff snapshot**
```
Build /counsellor/team (Head of Counselling only) per UC6: caseload bars, the reassignment panel, and wire the reassignment action to actually call generateHandoffSnapshot() from Stage 5, updating counsellor_caseloads with a reassigned_from history and showing the permanent Handoff Summary card on the receiving counsellor's view. Commit with message "[stage-6] Add Team view, reassignment flow, and handoff snapshot".
```

**Prompt 6.3 — E2E: Team view rendering**
```
Write a Playwright E2E test confirming the Team view renders correctly for a Head of Counselling test account (caseload bars show accurate counts per counsellor) and is not accessible to a regular counsellor test account. Commit with message "[stage-6] Add Team view E2E test".
```

**Prompt 6.4 — E2E: Reassignment + handoff snapshot**
```
Write a Playwright E2E test for a full reassignment producing a real (non-placeholder) handoff snapshot generated from the actual prior notes/roadmap state of a seeded test student, and confirm the receiving counsellor sees the permanent Handoff Summary card. Commit with message "[stage-6] Add Reassignment and handoff snapshot E2E test".
```

**Prompt 6.5 — End of stage**
```
Run the full test suite, lint, typecheck. Trigger the Sentry test route and confirm capture. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against the Team view, reassignment panel, and Handoff Summary card — confirm the Handoff Summary follows the Doctrine's permanent-AI-content treatment (black marker, not violet) and that the Team view's caseload bars follow Doctrine §15 (counsellor density/professional character), checked against its closest `UI Inspiration/` reference. Fix anything that fails before continuing. Run /graphify to refresh the index. Push stage-6-team-reassignment and open a PR against main titled "Stage 6: Team & Reassignment". Summarize the diff and the Doctrine check before I review.
```
(Merge, then `git checkout main && git pull`.)

---

## After Stage 6 — where the initial pilot build stops

Phase 7 (Microsoft Entra ID SSO migration + OneDrive/Graph API storage migration) is explicitly a later milestone, not part of the initial pilot build — it isn't included as a stage here on purpose. When you're ready to start it, budget the dedicated Entra ID ↔ Supabase Auth migration spike CLAUDE.md §9 calls out, and treat it as its own stage (`stage-7-entra-onedrive`) with the same branch/commit/PR/merge discipline as everything above.

**Before calling the pilot build itself done:** run the full E2E suite one final time on `main`, specifically re-confirming the two tests flagged as most important throughout this project — the private/shared note visibility boundary (Stage 3) and the AI drafts-vs-passive split (Stage 5) — since those are the two places a regression would be most damaging to the pilot's trust. Also do one final Sentry check (trigger the test route, confirm capture) and one final Graphify refresh so both are in a clean, current state before the pilot goes live.

---

## Tentative Addition (not scheduled) — Calendar & Forms

**Status: tentative, may implement.** This was originally Phase 6 of the build, scoped as its own stage. It's been pulled out entirely — not deleted, just moved here — after the Google Calendar OAuth setup hit a real failure (`SDK auth failed: HTTP 404` on `/register`, meaning the Google Calendar MCP URL used during setup doesn't actually work as documented). Rather than debug that mid-build, the whole feature (Google Calendar sync *and* the Forms feature, all three creation paths) is deferred to whenever you decide to actually build it. The nav items and "Coming soon" stub routes for both already exist from Stage 2 — this section replaces those stubs with the real thing.

If and when you pick this back up, revisit `MCP_and_Skills_Setup_Guide_v1.md`'s Google Calendar/Forms section first (it needs a real working OAuth setup verified before any of these prompts will function), then run this as its own branch with the same discipline as every stage above:

**Prompt T.1 — Branch**
```
Checkout main, pull latest, create branch stage-7-calendar-forms.
```

**Prompt T.2 — My Calendar + Google sync**
```
Replace the "Coming soon" stub at /counsellor/calendar (from Stage 2) with the real feature per UC9: month/week views, Connect Google Calendar (off by default, per the confirmed scoping), the two sync-direction toggles, and Prep Notes — wire the "Prep Notes" button here into the generateMeetingPrep() function built back in Stage 5. Commit with message "[stage-7] Add My Calendar with Google sync and Prep Notes".
```

**Prompt T.3 — Forms (all three paths)**
```
Replace the "Coming soon" stub at /counsellor/forms (from Stage 2) with the real feature per UC10 and the student-side form-as-to-do-card flow: native form creation, Microsoft Forms embed, and Google Forms embed — all three paths. Commit with message "[stage-7] Add Forms feature, all three creation paths".
```

**Prompt T.4 — Feature E2E tests**
```
Write Playwright E2E tests for: Google Calendar sync reflecting both directions without duplicating events (mock the Google API for this), and a form being created via each of the three paths with a student responding to it. Commit with message "[stage-7] Add Calendar and Forms E2E tests".
```

**Prompt T.5 — End of stage**
```
Run the full test suite, lint, typecheck. Trigger the Sentry test route and confirm capture. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against the real My Calendar and Forms screens replacing the Stage 2 stubs — confirm they were built against their closest `UI Inspiration/` reference and use Doctrine tokens throughout, same bar as every other stage, tentative status doesn't lower it. Fix anything that fails before continuing. Run /graphify to refresh the index. Push stage-7-calendar-forms and open a PR against main titled "Stage 7 (tentative): Calendar & Forms". Summarize the diff and the Doctrine check before I review.
```
