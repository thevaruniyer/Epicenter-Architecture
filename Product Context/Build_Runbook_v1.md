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
Inside apps/web, initialize shadcn/ui yourself (run pnpm dlx shadcn@latest init). Before generating any components, port the UI/UX Doctrine's tokens into tailwind.config.ts — use the exact block in Product Context/Epicenter_Education_Architecture_v1.md §0 (Epicenter Yellow #EDC001, surface-primary #FDFDFD, ink-primary #000000, the full neutral/semantic/radius/glass token set, Satoshi typography loaded via Fontshare) so every shadcn primitive inherits the Doctrine's actual look instead of shadcn's defaults. Do not port anything from the v3 storyboard HTML files' original <style> blocks — that palette (terracotta/rose/teal) and the old violet AI-badge colors (#6E62E5/#EFEBFC) are explicitly superseded and must not appear anywhere in tailwind.config.ts. Confirm components.json now exists. Then register the shadcn MCP server yourself by running pnpm dlx shadcn@latest mcp init --client claude from inside apps/web, and confirm it's connected by listing the available shadcn components. Commit with message "[stage-0] Initialize shadcn/ui with UI/UX Doctrine design tokens and register shadcn MCP".
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

## Stage 6.5 — UI/UX Fix & Polish Pass

Inserted after Stage 6 per Product Owner decision, not part of the original phase plan — this stage exists because real usage of the Stage 2/3-built screens surfaced a set of concrete gaps: a To Do widget that isn't Doctrine-compliant, a Calendar feature that got built outside the formal Tentative Addition path and needs reconciling against Doctrine/UI Inspiration, dashboards that read as flat/empty, a decorative-only search icon, and page transitions that feel slow. This is a retrofit stage against already-shipped screens, not new-build — treat every prompt below as "audit what exists, then fix it," not "build from scratch." Same branch/commit/PR/merge discipline as every stage above.

**Before starting:** install the Lighthouse MCP (`claude mcp add --transport stdio lighthouse --scope project -- npx lighthouse-mcp@latest` — verify with `claude mcp list`) so Prompt 6.5.7 has real before/after performance numbers instead of a subjective "feels smoother" call.

**Prompt 6.5.1 — Branch + baseline audit**
```
Checkout main, pull latest, create branch stage-6-5-ui-fixes. Before changing anything, use the Playwright MCP and Chrome DevTools MCP to screenshot the current live state of: student Home dashboard (established state), counsellor Dashboard, the search icon on both shells, and the existing Calendar and Forms features (both built outside the formal Stage 2/7 path — audit current routes and role access for each first). Save these as a baseline in a scratch folder, not committed, so later Doctrine-review prompts in this stage can do real before/after comparisons. Report back what you find before proceeding — specifically confirm whether Calendar is currently counsellor-only or already student-accessible, and which of the three Forms creation paths (native, Microsoft embed, Google embed) actually work today versus which are stubbed.
```

**Prompt 6.5.2 — Student To-Do widget: glass, roadmap-linked, calendar-aware**
```
Rebuild the student Home dashboard's To Do panel (SU1 Screen 10's .s-todo-panel in the storyboard) as a Doctrine-compliant glassmorphic card — port the same glass/surface tokens used in Stage 0's tailwind.config.ts, rectangular with the Doctrine's approved corner radius, positioned in the right-hand column of the existing dashboard grid exactly as the storyboard shows it. Content must pull live from the same roadmap_milestones/tasks data and status hook built in Stage 2/3 (task title, due date, same tick-then-confirm status) — no placeholder data. Additionally: if the student has an upcoming counsellor meeting in the Calendar feature, surface it as a distinct "Meeting" card at the top of the panel (visually distinguished from Task cards per Doctrine's semantic system, not just a color swap), linking through to the Calendar view on click. If there is no upcoming meeting, the panel shows tasks only — don't fabricate a meeting card. Commit with message "[stage-6.5] Rebuild student To Do widget with Doctrine glass tokens and calendar-aware meeting card".
```

**Prompt 6.5.3 — Calendar + Forms reconciliation, inert Connect Google Calendar button**
```
Both Calendar and Forms were built outside this Runbook's formal Stage 2 stub → Tentative Addition path — this prompt reconciles both against Doctrine and UI Inspiration rather than building either from scratch. For Calendar: audit against both UI Reference Calendar.jpg and UI Reference Calendar 2.jpg in UI Inspiration/ and against the UI/UX Doctrine, re-skin anything that doesn't match Doctrine tokens, and confirm/extend it so students can see their own upcoming meetings (not just counsellors), matching whatever role-scoping pattern the rest of the app uses. Add a "Connect Google Calendar" button — visible, on-brand, but intentionally non-functional (no OAuth flow wired yet, since Google Calendar MCP setup previously failed with HTTP 404 and hasn't been re-validated) — clicking it should show a clear "coming soon" state, not a dead click. For Forms: audit all three creation paths (native, Microsoft Forms embed, Google Forms embed) against the Doctrine and the student-side form-as-to-do-card flow from the storyboards, re-skin to Doctrine tokens, and confirm which paths are fully functional versus which need the same "inert but on-brand" treatment as the Calendar button if their OAuth isn't wired yet. Commit with message "[stage-6.5] Reconcile Calendar and Forms against Doctrine/UI Inspiration, add student calendar access and inert Connect Google Calendar button".
```

**Prompt 6.5.4 — Counsellor Dashboard: Doctrine + UI Inspiration redesign with semantic color**
```
Rebuild the counsellor Dashboard against both UI Ref 1 Dashboard.jpg and UI Reference 2 Dashboard.jpg in UI Inspiration/ — build against their composition/density/information hierarchy, then re-skin entirely in Doctrine tokens (never port their original colors). Use the Doctrine's existing semantic colour system (§7 — complete/overdue/pending/reach/target/safety tokens) more visibly across dashboard stat tiles and cards instead of leaving everything in neutral surfaces — these colours already exist in the Doctrine, this is about applying them more, not inventing a new palette. Important constraint: Doctrine's Motion Doctrine (§13.3) explicitly restricts "motion that makes professional work feel playful" and the counsellor shell is meant to read as professional-density (§15) — so get liveliness here from colour, whitespace, and card hierarchy, not from bouncy/playful animation. Commit with message "[stage-6.5] Redesign counsellor Dashboard against UI Inspiration references with Doctrine semantic colour".
```

**Prompt 6.5.5 — Student Dashboard: established-state liveliness pass**
```
Per confirmed scope, only the established-state dashboard (SU1 Screen 10 — the version with real tasks/roadmap progress, not the first-run sparse state) gets touched in this prompt. Leave the first-run empty state exactly as it is — the storyboard's own caption calls it "genuinely sparse, and that's correct," and that reasoning still holds; do not add placeholder content to make it look fuller. On the established state: restyle the hero, grade card, roadmap card, and To Do widget (from 6.5.2) using Doctrine tokens and the UI Inspiration dashboard references, with more expressive (but still Doctrine-compliant) use of the semantic colour set, and only Doctrine-approved motion (§13.1 — hover/focus states, status transitions, context-preserving page transitions). Use the emil-design-eng, impeccable, and taste-skill skills to review before committing. Commit with message "[stage-6.5] Add liveliness pass to established-state student Dashboard".
```

**Prompt 6.5.6 — Functional search, all interfaces, shadcn Command**
```
Replace the decorative search icon (s-search-circle in the storyboards) on both the counsellor and student shells with a real shadcn Command-based search (cmdk-style palette/combobox, installed via the shadcn MCP). Role-scoped: counsellor search queries students, notes, and applications; student search queries their own notes, roadmap, and shortlist. Typing shows a live dropdown of matched results; selecting a result navigates directly to that record's screen. This must work identically from every screen in both shells — not just the Students grid — since search currently doesn't work anywhere in either interface. Commit with message "[stage-6.5] Add functional shadcn Command search to counsellor and student shells".
```

**Prompt 6.5.7 — Page transition and interaction smoothness pass**
```
Before making any change, run the Lighthouse MCP against the dev build on the student Home, counsellor Dashboard, and Students grid routes, and use the Chrome DevTools MCP's network/performance panel to separate real causes from perceived ones: actual data-fetch/query latency and waterfalls vs. missing loading states/skeletons vs. absence of transition animation. Fix real bottlenecks first (query waterfalls, missing Suspense boundaries/loading skeletons, oversized client bundles) — don't paper over slow data-fetching with animation. Then add Doctrine-approved motion (§13.2's timing table) for page-level and component-level transitions, using the emil-design-eng skill for timing/easing specifics. Re-run Lighthouse after and report the before/after scores. Commit with message "[stage-6.5] Fix page-load bottlenecks and add Doctrine-approved transition motion".
```

**Prompt 6.5.8 — Full design-skill review pass**
```
Run /impeccable audit, the taste-skill review, and the emil-design-eng animation review across every screen touched this stage. For each, re-open its closest UI Inspiration/ reference file and compare side by side per Doctrine §3.2's mandatory re-open-and-compare step. Report what each skill flagged before committing any fixes, then commit with message "[stage-6.5] Apply design-skill review findings across UI fix pass".
```

**Prompt 6.5.9 — End of stage**
```
Run the full test suite, lint, typecheck. Trigger the Sentry test route and confirm capture. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against everything touched this stage, specifically confirming: the To Do widget uses real glass tokens (not a flat white box), both dashboards use the Doctrine's existing semantic colour tokens rather than invented colours, the counsellor Dashboard has no motion that reads as playful (§13.3), all new motion respects prefers-reduced-motion, and the Connect Google Calendar button is clearly inert rather than a dead click. Confirm the shadcn Command search works identically on every screen in both shells. Run /graphify to refresh the index. Push stage-6-5-ui-fixes and open a PR against main titled "Stage 6.5: UI/UX Fix & Polish Pass". Summarize the diff, the before/after Lighthouse scores from Prompt 6.5.7, and the Doctrine check before I review.
```
(Merge, then `git checkout main && git pull`.)

---

## Stage 8 — Documents, Dashboard Colour System, and Playful Interfaces

Continues Stage 6.5's "retrofit against real, already-shipped screens" pattern, not a new phase — just the next stage number (`stage-7-calendar-forms` is already a merged branch, so this is 8, not 7.5). Grounded directly against the live codebase (branch `stage-6-5-ui-fixes` as of this audit), not just the storyboards — file paths below are real, not inferred.

**Three deliberate Doctrine exceptions in this stage — read before executing:** (1) Prompt 8.3's "liquid glass pink gradient" for the AI-insights card background directly contradicts Doctrine §7.10 ("do not use a magical gradient... for AI-assisted content"). The `AiBadge` marker itself stays the standard black badge — only the card surface gets the gradient — but this is still a real, intentional departure from the written Doctrine, not a misread of it. (2) Prompt 8.3 also adds a new "review" semantic tone (light blue) to the dashboard's tone system, reusing the Doctrine's existing `target-*` tokens (already blue, currently used for Target-university shortlist pills) for a second, unrelated meaning. (3) Prompt 8.5 gives the student shell a persistent left sidebar identical to the counsellor's, reversing Doctrine §18.2's documented distinction that the student shell is deliberately simpler and not the counsellor's persistent professional sidebar. All three are product calls, not Doctrine-compliance bugs — flag them explicitly in the PR description so a future Doctrine-checklist pass doesn't "fix" them back, and log all three as a formal addendum to `UI-UX Doctrine/Epicenter_Education_UIUX_Doctrine_V1_Final.html` once merged so the written Doctrine and the shipped product stop disagreeing.

**Prompt 8.1 — Confirm Stage 6.5 is actually merged, then branch + baseline audit**
```
Hard gate before anything else: run `git log --oneline main` and `git branch -a`, and confirm stage-6-5-ui-fixes has actually been merged into main — Prompt 6.5.9's PR opened and merged, not just its commits pushed to the feature branch. If it has NOT been merged yet, stop here and tell me directly — do not branch for Stage 8 off an unmerged stage-6-5-ui-fixes, and do not proceed with anything below until I confirm it's merged. Only once main genuinely contains Stage 6.5's work: checkout main, pull latest, create branch stage-8-docs-dashboard-playful. Then screenshot current state via Playwright/Chrome DevTools MCP: the Documents tab at /counsellor/students/[id]/documents, the counsellor Dashboard, the counsellor Topbar's calendar icon, the student Home dashboard (established state), the student nav logo, and the landing page at /. Confirm the documents table and its existing upload path (already used in apps/web/lib/actions/student-roadmap.ts and apps/web/app/student/roadmap/page.tsx) before building anything new against it. Report findings before proceeding.
```

**Prompt 8.2 — Documents tab: chronological list, search, download/open, glassmorphic viewer**
```
Replace the current /counsellor/students/[id]/documents tab (apps/web/app/counsellor/students/[id]/documents/page.tsx), which today renders only <EssayReviewPanel> per its own comment ("Full document upload/versioning is not modelled yet"). Build a DocumentListCard querying the existing documents table (same one used by student-roadmap.ts) filtered by student_id, ordered by created_at descending — chronological, most recent first. Each row: filename/title, upload date, a Download button (signed URL from Supabase Storage, direct download) and an Open button. Open renders a glassmorphic viewer using the existing Dialog primitive (packages/ui/src/dialog.tsx) styled with the existing bg-glass/backdrop-blur-glass/shadow-glass Tailwind tokens (already defined in apps/web/tailwind.config.ts, used elsewhere e.g. the Sidebar) — inline preview for PDFs/images, a clear "download to view" fallback for other file types. Add a client-side search input filtering the list by filename. Keep the existing EssayReviewPanel, but move it below the new document list as a secondary section — do not add any AI action (grading, summarising, extraction) to the new document list itself, and do not remove or rewire the existing Stage 5 essay feedback capability, just don't extend it in this prompt. Commit with message "[stage-8] Replace Documents tab default view with searchable chronological document list and glassmorphic viewer".
```

**Prompt 8.3 — Counsellor Dashboard: colour system, calendar widget, remove Caseload progress, fix calendar icon**
```
Rework apps/web/app/counsellor/dashboard/page.tsx, apps/web/components/counsellor/attention-list-card.tsx, apps/web/components/counsellor/digest-card.tsx, and apps/web/components/counsellor/topbar.tsx together — this is one coherent pass, not five separate ones:

1. Add a small calendar widget to the Dashboard (reuse whatever the existing apps/web/components/counsellor/calendar-view.tsx already does for rendering, in a compact mode if it has one, or a simple month-grid if not) positioned near the existing "Today" meetings Card. Background: a calm light yellow — use the Doctrine's existing reach-bg token (#FFF5C7, "a calm yellow family distinct from the stronger action yellow," per Doctrine §7.4) rather than inventing a new yellow.
2. Re-skin the DigestCard (AI-generated insights) with a liquid-glass, mellow pink gradient background — this is a deliberate, flagged Doctrine §7.10 exception (see the stage note above), not a mistake. Keep the AiBadge marker itself as the standard black badge; only the card surface changes.
3. In attention-list-card.tsx, add a new tone to the TONE map — call it "review" — using the Doctrine's existing target-bg/target-border/target-ink tokens (already a light blue, currently used for Target-university shortlist pills elsewhere; this is the second, flagged Doctrine exception — reusing an existing token for a second meaning rather than inventing a new one). In dashboard/page.tsx, change the "Awaiting your review" AttentionListCard's tone from "pending" to "review" so it renders blue. Leave "Requires attention" on tone="overdue" (Doctrine's calm red, per §7.2 — "use a calm red rather than a bright alarm red") — it already matches what was asked for, just confirm the visual result actually reads as calm and light, not muted-away.
4. Delete the entire "Caseload progress" Card block from dashboard/page.tsx (the progressPct calculation, the progress bar, and the surrounding Card) — remove it outright, not just hide it. Check whether the same "% of tasks complete" metric appears anywhere else in the counsellor-facing UI (not the Team view's caseload bars from Stage 6 — those show workload distribution across counsellors, a different metric — but check individual student profile views) and flag anywhere else you find it before removing, rather than assuming Dashboard is the only place.
5. In topbar.tsx, the Calendar icon is currently a plain `<button type="button">` with no action — the file's own comment says wiring it was deliberately deferred. Convert it to a Next.js Link to /counsellor/calendar. Leave the Notifications and Profile icons as presentational for now — out of scope for this prompt.
6. Rebuild the Dashboard's overall layout, spacing, and visual hierarchy against UI Ref 1 Dashboard.jpg and UI Reference 2 Dashboard.jpg in UI Inspiration/ with heavy emphasis on actually matching their composition — Stage 6.5 already did one pass against these same references and the result still reads as flat, so look hard at what's different this time: density, imagery, card proportions, not just token substitution.
7. Remove every em dash from UI-facing copy strings in every file touched this prompt (component labels, descriptions, empty-states) — rewrite with a period, comma, or separate sentence instead. This applies to visible product copy, not code comments.

Commit with message "[stage-8] Add calendar widget and colour system to counsellor Dashboard, remove Caseload progress, fix calendar icon link".
```

**Prompt 8.4 — Student interface: colour, motion, and playful graphics, second pass**
```
Stage 6.5 (Prompt 6.5.5) already did one liveliness pass on the established-state student Home dashboard; it's still reading as clanky and utilitarian, so this is an intensified second pass, not a repeat. Unlike the counsellor shell, the student shell isn't bound by Doctrine §13.3/§15's "no playful motion, professional density" constraint — Doctrine §18.2 already treats the student shell as simpler and less formal than the counsellor's persistent professional sidebar, so there's real room here for a livelier, more playful treatment, within reduced-motion accessibility rules. Apply the Doctrine's semantic colour set more expressively across student Home's cards, add tasteful decorative graphic accents (simple abstract shapes/illustration consistent with the existing glass aesthetic — not stock clipart, not a jarring style shift), and layer in more generous Doctrine-approved motion (§13.1 — card entrance stagger, hover micro-interactions, richer page transitions) than 6.5's conservative pass used. Use the emil-design-eng, impeccable, and taste-skill skills throughout, and consult .claude/skills/epicenter-conventions/SKILL.md before making changes so this stays consistent with what's already been established, not a fresh reinvention. Commit with message "[stage-8] Second liveliness pass on student Home dashboard with playful graphics and expanded motion".
```

**Prompt 8.5 — Student interface: persistent left sidebar replacing top navbar**
```
Per explicit product direction, replace the student shell's top navbar with a persistent left sidebar identical to the counsellor's — this is the third flagged Doctrine exception in this stage (see the stage note above), reversing §18.2's documented "simpler, not the counsellor's persistent sidebar" distinction. Log it as a Doctrine addendum alongside the other two once merged. This prompt only changes the navigation shell — do not touch any dashboard page content (To Do widget, Home cards, Roadmap, Notes, Shortlist, Application, Calendar, Profile all stay exactly as they are).

Build apps/web/components/student/student-sidebar.tsx directly from apps/web/components/counsellor/sidebar.tsx's structure and visual treatment — same glass surface, same active-state left accent bar and yellow indicator, same text-only "EPICENTER." wordmark with no icon. Copying the counsellor sidebar's already icon-less treatment here also fully resolves the earlier ask to drop the Sparkles-icon logo from the student side, so no separate logo prompt is needed. Use the student's existing nav items from student-nav.tsx's NAV array (Home, Roadmap, Notes, College Shortlist, My Application, My Calendar, My Profile) with the same hrefs, and the same sign-out form at the bottom.

Rewrite apps/web/app/student/layout.tsx to use the same grid pattern as apps/web/app/counsellor/layout.tsx: a fixed-width left column for the new StudentSidebar (hidden below the md breakpoint, matching the counsellor layout's responsive behaviour) and a right column for page content. Move the existing SearchPalette (searchStudent action) out of the old top bar into a new, slim apps/web/components/student/student-topbar.tsx above the main content, mirroring apps/web/components/counsellor/topbar.tsx's structure — search only, no notifications/calendar/profile icons, since those weren't part of the student experience before and adding them isn't in scope here.

Once nothing references it, delete apps/web/components/student/student-nav.tsx — confirm with a repo-wide search that it's fully unused before removing it, don't leave dead code behind. Commit with message "[stage-8] Replace student top navbar with persistent left sidebar matching counsellor shell".
```

**Prompt 8.6 — Landing page copy rewrite**
```
apps/web/app/page.tsx currently reads "Epicenter Education" (eyebrow label) above "College counselling, organised." (H1). Replace with three lines: "Epicenter." as the top line, "Let's all be on the same page" as the main heading below it, and "THE AI LMS BUILT FOR COUNSELLORS AND STUDENTS" as small caps Satoshi text just below that (reuse the existing text-xs font-bold uppercase tracking-wide utility already used for the current eyebrow label, don't invent a new type style for it). Commit with message "[stage-8] Rewrite landing page hero copy".
```

**Prompt 8.7 — Design-skill review pass**
```
Run /impeccable audit, the taste-skill review, and the emil-design-eng animation review across every screen touched this stage. Explicitly re-read .claude/skills/epicenter-conventions/SKILL.md and confirm nothing built this stage drifts from it — update the skill via skill-creator if something genuinely new was established (the "review" blue tone, the AI-insights gradient exception) that later stages should know about. For each screen, re-open its closest UI Inspiration/ reference and compare side by side per Doctrine §3.2. Report what each skill flagged before committing, then commit with message "[stage-8] Apply design-skill review findings".
```

**Prompt 8.8 — End of stage**
```
Run the full test suite, lint, typecheck. Trigger the Sentry test route and confirm capture. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against everything touched this stage — but explicitly note the three flagged Doctrine exceptions (AI-insights pink gradient card, the new "review" blue tone, the student shell's persistent left sidebar) as intentional and do not revert them; confirm every other item still holds (AiBadge marker itself is still black, "Requires attention" still calm red not alarm red, all new motion respects prefers-reduced-motion, student-side motion doesn't break clarity even though it's more playful than the counsellor side). Confirm: the Documents tab shows a real chronological, searchable list with working Download/Open and a glassmorphic viewer; the counsellor Dashboard's Calendar icon actually navigates to /counsellor/calendar; Caseload progress is gone; no em dashes remain in any UI copy touched this stage; the student shell now renders the same persistent left-sidebar layout as the counsellor shell, with student-nav.tsx fully removed and no dead references to it left behind. Run /graphify to refresh the index. Push stage-8-docs-dashboard-playful and open a PR against main titled "Stage 8: Documents, Dashboard Colour System, and Playful Interfaces". Summarize the diff, and call out all three Doctrine exceptions explicitly so they get a deliberate sign-off, not a silent merge.
```
(Merge, then `git checkout main && git pull`.)

---

## Stage 9 — Onboarding Fix, Notifications, Product Tour, and Final Polish

Continues the Stage 6.5/8 retrofit pattern. **Explicit constraint for this whole stage: do not touch mobile or responsive breakpoints anywhere** — a mobile-friendly approach is being worked out separately, and none of the prompts below should add, fix, or alter `md:`/responsive behaviour, even where it would be tempting (the notification panel especially — build it for desktop only).

**A confirmed, permanent exception to a non-negotiable rule — already resolved, no further sign-off needed:** `CLAUDE.md` §4's "all pop-up panels center on screen" rule now explicitly carves out the Notifications panel as the one confirmed exception (Product Owner decision, already written into `CLAUDE.md` §4 itself — check the current file, the addendum is already there before you start this stage). Build the right-edge floating panel in Prompt 9.8 as specified, no need to re-flag it as pending or ask again — just confirm in the end-of-stage prompt that the shipped panel matches what `CLAUDE.md` now describes.

**Root cause already diagnosed for Prompt 9.2, so it doesn't need rediscovering:** `apps/web/lib/actions/auth.ts`'s `signUp` function creates the Supabase Auth user but never inserts a row into `student_profiles`. `apps/web/app/app/page.tsx` (the post-login router) only redirects to `/onboarding` `if (profile && !profile.onboarding_completed_at)` — when `profile` is `null` (true for every self-signup student today, since the row is never created), it silently falls through to `/student/home`, skipping onboarding entirely. `apps/web/app/onboarding/page.tsx` has the same blind spot (`if (!profile || profile.onboarding_completed_at) redirect("/student/home")`). This is why no new student ever sees onboarding — not a routing bug in either of those two files, both already do the right thing *if* a profile row exists.

**Prompt 9.1 — Confirm Stage 8 is merged, then branch + baseline audit**
```
Hard gate, same pattern as Prompt 8.1: run `git log --oneline main` and `git branch -a` and confirm stage-8-docs-dashboard-playful has actually been merged into main. If it hasn't, stop and tell me — do not branch off an unmerged Stage 8. Once confirmed merged: checkout main, pull latest, create branch stage-9-onboarding-notifications-polish. Screenshot current state via Playwright/Chrome DevTools MCP: the signup → first-login flow for a brand-new student account (confirm it currently skips onboarding), the search palette, the counsellor and student sidebars' current wordmark, the landing page, and the counsellor Topbar's notification bell. Confirm which routes under apps/web/app currently lack a loading.tsx (only student/home, counsellor/dashboard, and counsellor/students have one as of Stage 6.5). Report findings before proceeding.
```

**Prompt 9.2 — Fix the student onboarding gate (root cause: no student_profiles row created at signup)**
```
Fix apps/web/lib/actions/auth.ts's signUp function: when role === "student", insert a row into student_profiles for the new user (onboarding_current_step defaulting to 0, onboarding_completed_at left null) as part of the same signup flow, before the redirect to /app. Do not change the redirect logic in apps/web/app/app/page.tsx or apps/web/app/onboarding/page.tsx — both already handle the onboarding-vs-home decision correctly once a profile row actually exists; this is a data-creation fix, not a routing fix. Separately, check what assigned_counsellor_id ends up as for a self-signed-up student with no counsellor assignment — report back what you find (nullable column, RLS implications, whether such a student becomes invisible to every counsellor) rather than guessing a default assignment, since that's a product decision, not a bug fix. Write or extend an E2E test confirming a brand-new self-signup student is correctly routed into the 6-step onboarding wizard on first login, not straight to Home. Commit with message "[stage-9] Fix student onboarding gate: create student_profiles row at signup".
```

**Prompt 9.3 — Keyboard shortcut for Command search**
```
Add a Cmd+K (Mac) / Ctrl+K (Windows/Linux) global keyboard shortcut to apps/web/components/shared/search-palette.tsx that opens the same Command palette the click handler already opens. Show a small "⌘K" hint inside the search bar itself (visible affordance, not just a hidden shortcut) so it's discoverable without documentation. Works identically for both the counsellor and student instances of SearchPalette. Commit with message "[stage-9] Add Cmd+K/Ctrl+K shortcut and visible hint to Command search".
```

**Prompt 9.4 — Loading skeletons for the remaining routes**
```
Using the exact pattern already established in apps/web/app/counsellor/dashboard/loading.tsx (Skeleton primitive from @epicenter/ui, role="status" aria-label="Loading" wrapper so screen readers get one announcement instead of silence), add a loading.tsx to every route that's still missing one: Roadmap, Notes, College Shortlist, My Application, My Calendar, My Profile (student side), and Applications Centre, Internal Notes, Reports, Forms, My Calendar, Team, and each student's Documents tab (counsellor side). Shape each skeleton to roughly match that route's actual content layout (list rows for Notes/Roadmap, a grid for Students-style pages, a form shape for Profile) rather than reusing one generic skeleton everywhere. Commit with message "[stage-9] Add loading skeletons to all remaining routes".
```

**Prompt 9.5 — Doctrine-styled error and not-found pages**
```
There is currently no error.tsx or not-found.tsx anywhere in apps/web/app — a thrown error (e.g. a failed Supabase query) shows Next.js's raw default error page, and an invalid route shows the default 404, neither styled, both off-Doctrine and confusing for a non-technical counsellor or student mid-pilot. Add a root apps/web/app/error.tsx and apps/web/app/not-found.tsx built from Doctrine tokens (same glass/surface treatment as the rest of the app, Satoshi type, calm and reassuring copy rather than a technical stack trace) with a clear way back (a button to Home for whichever role the session belongs to, or to /login if there's no session). Also add role-scoped versions at apps/web/app/counsellor/error.tsx and apps/web/app/student/error.tsx if the messaging or "go back to" destination should differ by role (confirm this makes sense rather than assuming it does). The error boundary must not leak raw error messages or stack traces to the user — log the real error to Sentry, show a calm generic message. Commit with message "[stage-9] Add Doctrine-styled error and not-found pages".
```

**Prompt 9.6 — Remove the wordmark from both sidebars; sweep every em dash from UI copy and AI-generated text**
```
Two unrelated fixes bundled because both are global sweeps, not feature work:

1. Remove the "EPICENTER." wordmark entirely from apps/web/components/counsellor/sidebar.tsx and apps/web/components/student/student-sidebar.tsx — no logo, no wordmark, just the nav items and whatever spacing reads cleanly without it. Do not touch the landing page's "Epicenter." hero line from Stage 8 Prompt 8.6 — that's page copy, not the nav-shell logo, and stays as-is (it gets its own animation treatment in Prompt 9.9 below).
2. Remove every em dash from every piece of UI-facing copy across the entire app — not just the Dashboard copy Stage 8 already fixed, everywhere: component labels, descriptions, empty states, button text, toasts, error copy written in Prompt 9.5. Rewrite each with a period, comma, or separate sentence. This also applies to the phrasing instructions given to Gemini in packages/ai — check the prompt templates for the Daily Digest, Risk Flags, Stalled-Task Alerts, and any other generated-text feature, and add an explicit instruction telling the model not to use em dashes in its output, since generated text is a second source of em dashes that a static find-and-replace won't catch. Do not touch code comments or this Runbook — this is scoped to user-facing product copy only.

Commit with message "[stage-9] Remove sidebar wordmark and sweep all em dashes from UI copy and AI prompt instructions".
```

**Prompt 9.7 — Notifications: data model and event triggers**
```
No notifications table exists yet — build one. Add a migration for a notifications table: id, user_id (the recipient, references users), type (text), title (text), body (text, nullable), cta_label (text, nullable), cta_href (text, nullable), read_at (timestamptz, nullable), created_at (timestamptz default now()). Write the RLS policy: a user can only select/update their own rows (user_id = auth.uid()), matching the same RLS-everywhere principle as every other table in this app — inserts happen server-side through application code, not directly by end users.

Wire notification creation into exactly three existing event points — find the real function in each of these files and add the insert there, don't build new trigger infrastructure beyond what's needed for these three:
1. Reassignment (apps/web/lib/actions/team.ts) — when a Head of Counselling reassigns a student to a different counsellor, insert a notification for the receiving counsellor. No CTA needed unless there's an obvious destination (e.g. the student's profile) — otherwise it's informational only, per the confirmed pattern that not every notification needs to lead somewhere.
2. Meeting creation (apps/web/lib/actions/calendar.ts) — when a counsellor creates a calendar event for a student, insert a notification for that student with cta_label "Go to Calendar" and cta_href pointing at /student/calendar.
3. Task assignment (apps/web/lib/actions/roadmap.ts) — when a counsellor creates or assigns a roadmap task, insert a notification for that student with cta_label "Go to Task" and cta_href pointing at the specific task on /student/roadmap (deep-link to the task if the route supports it, not just the roadmap list).

Commit with message "[stage-9] Add notifications table, RLS, and triggers for reassignment, meeting creation, and task assignment".
```

**Prompt 9.8 — Notifications: floating panel UI and Bell wiring for both shells**
```
This is the confirmed non-negotiable-rule exception from the stage note above — a right-edge floating panel, not centered. CLAUDE.md §4 already documents this as the one sanctioned exception to the centering rule, so build it as specified without pausing for further confirmation.

Build a shared NotificationPanel component: a floating, rectangular panel with rounded corners, anchored to the right edge of the viewport (not a centered Dialog, a right-side overlay/drawer), using the same glass treatment as the rest of the app (bg-glass, backdrop-blur-glass, shadow-glass tokens). It lists the current user's notifications (newest first) querying the notifications table from Prompt 9.7, each row showing title/body and, if cta_href is set, a button using cta_label that navigates there; rows with no cta_href render as plain informational text with no button. Opening the panel is triggered by clicking the Bell icon.

Wire it into both shells: in apps/web/components/counsellor/topbar.tsx, the Bell icon is currently presentational (plain button, no action) — wire it to open the panel. The student shell has no Bell icon at all today (apps/web/components/student/student-topbar.tsx only has search) — add one, styled consistently with the counsellor topbar's icon buttons, and wire it the same way.

Add a lightweight unread indicator (a small dot or count badge on the Bell icon itself, driven by read_at being null) since showing zero signal that new notifications exist would undercut the whole feature — mark notifications as read when the panel is opened, or when an individual notification is clicked, your call on which reads better, just be consistent between the two shells. Commit with message "[stage-9] Add floating notifications panel and wire Bell icon on both shells".
```

**Prompt 9.9 — Landing page entrance animation sequence**
```
Sequence the landing page (apps/web/app/page.tsx, copy already rewritten in Stage 8 Prompt 8.6) as a staged reveal, each step gated on the previous one finishing, not all firing at once: "Let's all be on the same page" types out character by character like it's being typed live; once typing completes, "THE AI LMS BUILT FOR COUNSELLORS AND STUDENTS" fades in below it; once that fade-in completes, a single control appears in place of today's two separate Log in / Sign up buttons — clicking it expands to reveal both options (an actual dropdown/expanding control, not a reveal animation on the existing two buttons — this is confirmed, no need to ask). Respect prefers-reduced-motion by skipping straight to the fully-revealed end state for users who have it set. Commit with message "[stage-9] Add staged entrance animation sequence and dropdown login/signup control to landing page".
```

**Prompt 9.10 — First-time interactive product tour: reusable engine**
```
Build a reusable spotlight/coach-mark component: given a target element and explanatory text, it dims/blurs the rest of the screen, highlights the target with a cutout, and shows a small text callout near it with Next/Skip controls, advancing through a sequence of steps. Persist completion in the database, not localStorage — add a boolean column (e.g. product_tour_completed_at, nullable timestamptz) to both student_profiles and wherever counsellor-side user state lives, so the tour reliably never shows again for a user who's already seen it, across devices and sessions, and reliably does show for every genuinely new user. The tour must only trigger once, immediately after a user's first meaningful landing on their home surface (post-onboarding for students, first dashboard visit for counsellors) — never for a returning user, and never re-triggered by a page refresh mid-tour without an explicit restart action. Commit with message "[stage-9] Build reusable first-time product tour engine with persisted completion state".
```

**Prompt 9.11 — First-time product tour: per-role step content**
```
Using the engine from Prompt 9.10, wire the actual tour sequences for both roles. Student steps, in order: To Do widget (Home), Roadmap, Notes, College Shortlist, My Application, My Calendar, My Profile, then the new Notifications bell from Prompt 9.8 — one short explanatory sentence per step, plain language, no jargon. Counsellor steps, in order: Dashboard (the digest, attention cards, and new calendar widget from Stage 8), Students, Applications Centre, Internal Notes, Reports, Forms, My Calendar, then Notifications. Keep each callout's copy short enough to read in a couple of seconds — this is orientation, not documentation. Commit with message "[stage-9] Wire first-time product tour content for student and counsellor roles".
```

**Prompt 9.12 — Design-skill review pass**
```
Run /impeccable audit, the taste-skill review, and the emil-design-eng animation review across every screen touched this stage — the notifications panel and the landing page animation sequence especially deserve real scrutiny, both are more novel than a typical retrofit prompt. Re-read .claude/skills/epicenter-conventions/SKILL.md and update it via skill-creator if the notifications panel's right-edge exception or the product tour pattern are worth encoding for future stages to reference. For each screen, re-open its closest UI Inspiration/ reference and compare side by side per Doctrine §3.2. Report what each skill flagged before committing, then commit with message "[stage-9] Apply design-skill review findings".
```

**Prompt 9.13 — End of stage**
```
Run the full test suite, lint, typecheck. Trigger the Sentry test route and confirm capture, and also deliberately trigger the new error.tsx boundary (e.g. force a query to throw) and confirm Sentry captures that too, not just the dedicated debug route. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against everything touched this stage — confirm the notifications panel's non-centered placement matches the exception already documented in CLAUDE.md §4 (Product Owner-confirmed, not pending). Confirm: a brand-new self-signup student is routed through onboarding, not Home; Cmd+K opens search on both shells; every route has a loading.tsx; error.tsx/not-found.tsx render Doctrine-styled pages with no leaked stack traces; neither sidebar shows a wordmark; no em dashes remain anywhere in UI copy or AI-generated text; notifications actually get created for all three trigger events and the panel/Bell/unread-indicator work on both shells; the landing page's dropdown login/signup control and animation sequence both work and respect prefers-reduced-motion; the product tour shows exactly once for a new user of each role and never for a returning one. Run /graphify to refresh the index. Push stage-9-onboarding-notifications-polish and open a PR against main titled "Stage 9: Onboarding Fix, Notifications, Product Tour, and Final Polish". Summarize the diff before I review.
```
(Merge, then `git checkout main && git pull`.)

---

## Stage 10 — Name Capture, Logo Cleanup, and the Real Welcome Sequence

Continues the retrofit pattern. Grounded directly against the current codebase (branch `stage-9-onboarding-notifications-polish` as of this audit, which already went further than its original 13 prompts — it also cut onboarding step-transition latency, centered the new login/signup control, and closed remaining loading/focus gaps — so some of what's below interacts with work that landed after the original Stage 9 prompts were written).

**Root causes already diagnosed, so they don't need rediscovering:**
- **Missing name field:** `users.full_name` already exists as a column and is already correctly read everywhere it's displayed — `apps/web/app/student/home/page.tsx` already renders `Hi {name}` and `Welcome back, {name}` off it, with "there" only as the fallback when it's null. Nothing needs to change in how the name is *displayed*. The gap is purely that nothing ever *captures* it — `apps/web/lib/onboarding.ts`'s `ONBOARDING_STEPS` has no name step, and `apps/web/lib/actions/onboarding.ts`'s `saveOnboardingStep` has no case that writes to `users.full_name` (every existing case writes to `student_profiles` via `patchProfile()`, a different table).
- **Textbox not clearing between steps:** `apps/web/components/onboarding/tag-field.tsx`'s `OnboardingTagField` (used for the hobbies/major/extracurriculars steps) initializes `const [text, setText] = useState(defaultValue)`. Because those three consecutive steps all render the same component type at the same position in the tree, React reconciles rather than remounts when moving between them, so `useState`'s initial value never re-applies and stale text lingers until the user types over it. This is a missing `key`, not a data bug.
- **Lingering Sparkles logo:** Stage 8/9 already removed the wordmark from both sidebars, but `apps/web/components/auth/auth-panel.tsx` (login/signup) and `apps/web/components/onboarding/onboarding-shell.tsx` (the onboarding wizard) both still render the identical icon-in-a-black-box + "EPICENTER." lockup — these are the two remaining spots. Do not touch the other files where `Sparkles` appears (`add-update.tsx`, `note-composer.tsx`, `paste-requirements-dialog.tsx`, `essay-review-panel.tsx`, `meeting-prep-panel.tsx`) — those are the Doctrine-mandated AI-affordance icon (§7.10/§35.7), not the logo, and removing them would be a Doctrine violation in the other direction.

**Prompt 10.1 — Confirm Stage 9 is merged, then branch + baseline audit**
```
Hard gate, same pattern as Prompts 8.1 and 9.1: run `git log --oneline main` and `git branch -a` and confirm stage-9-onboarding-notifications-polish has actually been merged into main. If it hasn't, stop and tell me — do not branch off an unmerged Stage 9. Once confirmed merged: checkout main, pull latest, create branch stage-10-welcome-sequence. Screenshot the current onboarding flow end to end (all steps, including the hobbies → major → extracurriculars transition where the textbox staleness shows up), the login/signup AuthPanel, the post-onboarding landing on Home, and the current product tour's spotlight shape on at least two different targets (a small one like a single stat tile and a large one like the whole To Do panel, since the "rectangle with borders" complaint may look different at different target sizes). Report findings before proceeding.
```

**Prompt 10.2 — Add the name step, wire it to users.full_name, renumber the rest**
```
Add a new first step to apps/web/lib/onboarding.ts's ONBOARDING_STEPS array — key "name", question along the lines of "What's your name?", asked before age. Renumber every existing step by one (age becomes step 1, grade step 2, subjects step 3, hobbies step 4, major step 5, extracurriculars step 6) and update TOTAL_STEPS accordingly. Add the matching case 0 in apps/web/components/onboarding/onboarding-step-form.tsx's StepField (a plain text input, first/full name per your judgment on which reads more natural for a one-question screen) and renumber that switch's other cases to match. In apps/web/lib/actions/onboarding.ts's saveOnboardingStep, add handling for the new step 0: since full_name lives on the users table and every existing case in this function writes to student_profiles via patchProfile(), the name step needs its own separate supabase.from("users").update({ full_name }).eq("id", user.id) call in addition to (not instead of) the normal onboarding_current_step bookkeeping that already happens for every step. Confirm the RLS policy allows a user to update their own users.full_name — if it doesn't, add the policy. Write or extend an E2E test confirming a name entered during onboarding actually shows up as "Hi {name}" on the student Home dashboard afterward, not just that the onboarding step itself saves. Commit with message "[stage-10] Add name as the first onboarding step, wired to users.full_name".
```

**Prompt 10.3 — Fix stale onboarding textbox on step transitions**
```
In apps/web/components/onboarding/onboarding-step-form.tsx, key the rendered StepField (or, more targeted, key each OnboardingTagField usage in cases 4/5/6 post-renumbering) by the current step number, so React fully remounts the field — and therefore resets its internal useState — every time the step changes, instead of reconciling the same component instance in place across the hobbies → major → extracurriculars sequence. Verify by walking through those three consecutive steps and confirming the field is visibly empty (or shows that step's own defaultValue, never the previous step's leftover text) immediately on arrival, with no need to type first. Commit with message "[stage-10] Fix stale onboarding field state across step transitions with a step-keyed remount".
```

**Prompt 10.4 — Remove "Suggest tags with AI" from onboarding**
```
Simplify apps/web/components/onboarding/tag-field.tsx's OnboardingTagField back down to a plain text/textarea field, matching the pre-AI Stage 3 baseline — remove the "Suggest tags with AI" button, the chip-editing UI, the AiBadge display, and the suggest() call into suggestOnboardingTags. The field should just be a plain input/textarea the student types into directly, no AI affordance visible anywhere on the onboarding steps. Leave apps/web/lib/actions/onboarding.ts's suggestOnboardingTags server action and the underlying extractOnboardingTags AI function in place but unused, unless a repo-wide check confirms nothing else references them, in which case remove them too — your call once you've checked. Commit with message "[stage-10] Remove AI tag suggestion from onboarding, revert to plain text fields".
```

**Prompt 10.5 — Remove the Sparkles logo from AuthPanel and OnboardingShell**
```
Remove the icon-in-a-black-box + "EPICENTER." lockup entirely from apps/web/components/auth/auth-panel.tsx and apps/web/components/onboarding/onboarding-shell.tsx — same treatment already applied to both sidebars in Stage 8/9, just the two remaining locations. No replacement logo, no wordmark, nothing in its place — per confirmed direction, there is no real logo yet and none should appear anywhere. Confirm with a repo-wide search that these were the last two occurrences of the icon-lockup pattern before committing. Do not touch the Sparkles icon anywhere it's functioning as the Doctrine AI-affordance marker (essay-review-panel.tsx, note-composer.tsx, paste-requirements-dialog.tsx, meeting-prep-panel.tsx, add-update.tsx) — that's a different, intentional use and stays. Commit with message "[stage-10] Remove remaining Sparkles logo lockup from AuthPanel and OnboardingShell".
```

**Prompt 10.6 — Real welcome sequence: name fade-in, transition card, into the existing tour**
```
Extend the ProductTour engine/flow from Stage 9 (Prompts 9.10/9.11) with a new opening phase that plays before the first spotlight step, using the same product_tour_completed_at gating already built — this is one continuous first-time experience, not a second trigger to design from scratch:

1. Immediately after onboarding finishes (the Finish action on the last step redirects to Home), show "Welcome to Epicenter, {name}" as a smooth, dynamic fade-in using the name captured in Prompt 10.2 — full screen, calm entrance, no sparkle/gradient effects (Doctrine's AI-content restrictions don't apply here, but the "factual not magical" spirit still does — keep it clean).
2. That fades out into the dashboard itself, visible but blurred behind an overlay, with a centered card reading "Welcome to Epicenter. Let's get you familiar with things." and a "Next" button.
3. Clicking Next hands off directly into the existing per-component spotlight tour from Prompt 9.11 — same steps, same engine, no gap or redundant intro screen between the transition card and the first spotlight.

This sequence is student-first-onboarding-specific (it only makes sense immediately after finishing the wizard), so gate it on having just completed onboarding this session, not merely on product_tour_completed_at being null in general — a student who reaches the tour some other way (e.g. an already-onboarded account that hasn't seen the tour yet for some other reason) should still get the existing Stage 9 tour-only experience, not a "Welcome to Epicenter" replay that no longer makes contextual sense. Respect prefers-reduced-motion by collapsing straight to the transition card. Commit with message "[stage-10] Add post-onboarding welcome animation and transition card ahead of the existing product tour".
```

**Prompt 10.7 — Fix the product tour spotlight to capture the component's actual shape**
```
In apps/web/components/shared/product-tour.tsx, the spotlight cutout currently pads the target's bounding box by 8px (PAD) and draws a fixed rounded-lg ring around it — which is exactly what reads as "a rectangle built around the component" rather than the component itself being revealed. Remove the padding (or bring it as close to zero as still looks intentional) so the cutout's top/left/width/height match the target element's actual getBoundingClientRect() precisely. Read the target element's own computed border-radius (getComputedStyle) and apply that to the cutout instead of the fixed rounded-lg, so a component with large rounded corners gets a matching cutout shape rather than a generically-rounded rectangle. Reconsider whether the yellow ring border is even needed once the cutout hugs the component exactly — a tight, correctly-rounded cutout against the blurred backdrop may not need an additional border to read clearly; try both and use your judgment, but the padding and shape-mismatch are the two concrete things to fix regardless. Verify against both a small target (a stat tile) and a large one (the whole To Do panel) — confirm it reads as "revealing that exact component" at both sizes, not a box drawn near it. Commit with message "[stage-10] Fix product tour spotlight to conform exactly to target component shape, not a padded rectangle".
```

**Prompt 10.8 — Design-skill review pass**
```
Run /impeccable audit, the taste-skill review, and the emil-design-eng animation review across every screen touched this stage — the welcome sequence and the reshaped spotlight both deserve real scrutiny, they're the most visually novel pieces. Re-read .claude/skills/epicenter-conventions/SKILL.md and update it via skill-creator if the welcome-sequence pattern or the shape-matched spotlight approach are worth encoding for future stages. For each screen, re-open its closest UI Inspiration/ reference and compare side by side per Doctrine §3.2. Report what each skill flagged before committing, then commit with message "[stage-10] Apply design-skill review findings".
```

**Prompt 10.9 — End of stage**
```
Run the full test suite, lint, typecheck. Trigger the Sentry test route and confirm capture. Run the UI/UX Doctrine's Design Review Checklist (Part XIV) against everything touched this stage. Confirm specifically: a new student is asked for their name as the very first onboarding step, and their real name (not "there") shows on Home immediately afterward; the hobbies/major/extracurriculars steps show clean, empty (or correctly pre-filled) fields on arrival, never leftover text from the previous step; "Suggest tags with AI" no longer appears anywhere in onboarding; no Sparkles-logo lockup remains in AuthPanel or OnboardingShell, while the AI-affordance sparkle icon is untouched everywhere else it legitimately belongs; the welcome animation plays exactly once, immediately after onboarding finishes, then hands off cleanly into the existing tour with no gap or redundant screen; the tour's spotlight now visibly conforms to each target's real shape and size rather than a padded rectangle, checked on both a small and a large target. Run /graphify to refresh the index. Push stage-10-welcome-sequence and open a PR against main titled "Stage 10: Name Capture, Logo Cleanup, and the Real Welcome Sequence". Summarize the diff before I review.
```
(Merge, then `git checkout main && git pull`.)

---

## After Stage 6 — where the initial pilot build stops

Phase 7 (Microsoft Entra ID SSO migration + OneDrive/Graph API storage migration) is explicitly a later milestone, not part of the initial pilot build — it isn't included as a stage here on purpose. When you're ready to start it, budget the dedicated Entra ID ↔ Supabase Auth migration spike CLAUDE.md §9 calls out, and treat it as its own stage (`stage-7-entra-onedrive`) with the same branch/commit/PR/merge discipline as everything above.

**Before calling the pilot build itself done:** run the full E2E suite one final time on `main`, specifically re-confirming the two tests flagged as most important throughout this project — the private/shared note visibility boundary (Stage 3) and the AI drafts-vs-passive split (Stage 5) — since those are the two places a regression would be most damaging to the pilot's trust. Also do one final Sentry check (trigger the test route, confirm capture) and one final Graphify refresh so both are in a clean, current state before the pilot goes live.

---

## Formerly-Tentative Addition — Calendar & Forms (both already built)

**Status update, post Stage 6.5:** neither Calendar nor Forms is tentative anymore — both were built outside this Runbook's formal path at some point before Stage 6.5, and Stage 6.5 (Prompt 6.5.3) reconciled both against Doctrine/UI Inspiration rather than building either from scratch. The "build from scratch" prompts (T.1–T.5) originally written for this section no longer apply and are kept below only as a historical record of the original scope — do not run them as written.

**What's actually still outstanding:** real Google OAuth wiring. The `HTTP 404` failure on the Google Calendar MCP's documented endpoint (noted below) was never resolved — it was worked around by shipping the Calendar UI with an inert "Connect Google Calendar" button (Stage 6.5) instead of a working sync. Same likely applies to whichever of Forms' three creation paths depend on Google/Microsoft OAuth (confirmed per-path in Stage 6.5, Prompt 6.5.1's audit). When you're ready to actually wire real OAuth for either:

1. Revisit `MCP_and_Skills_Setup_Guide_v1.md`'s Google Calendar/Forms section first and get a real working connection verified — the documented endpoint failure below needs to actually be resolved this time, not routed around again.
2. Treat it as its own small stage (e.g. `stage-7-oauth-wiring`) scoped to "wire real OAuth into the existing inert buttons," not a full feature build — the UI, routes, and non-OAuth functionality already exist.
3. Add the E2E coverage from the original Prompt T.4 below (Google Calendar sync both directions without duplicating events, mocked; a form created via each of the three paths with a student responding) once the real OAuth flow is in.

<details>
<summary>Original from-scratch prompts (superseded, kept for reference only)</summary>

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

</details>
