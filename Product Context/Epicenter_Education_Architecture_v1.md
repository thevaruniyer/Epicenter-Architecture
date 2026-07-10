# Epicenter Education — Technical Architecture Document v1

## 0. Purpose and How to Read This

This document turns everything decided so far into a build-ready architecture. It exists so a build agent (Claude Code) can pick this up and know exactly what to build, in what order, and why — without re-deriving product decisions from scratch.

**Source documents, and which one wins on conflict:**
- `Epicenter_Education_PRD_v1.md` — the product requirements: problem, users, use cases, goals/non-goals, permissions.
- `AI_Integrations_Spec_v1.md` and `AI_Integration_Flow_Plan_v1.md` — what each AI feature does and how it's triggered.
- `Information Architecture/01_Information_Architecture_V1.html` + `02_Information_Architecture_Explanation.md` — the original navigation/sitemap thinking. **Partially superseded**: it predates the Forms feature, My Calendar, the onboarding wizard, and every AI feature. Where it conflicts with the flow storyboards below, the storyboards win.
- `User Flows/10_Counsellor_Flows_Full_PRD_Chronological_v3.html` and `11_Student_Flows_Full_PRD_Chronological_v3.html` — **the definitive, final source of truth for screen structure, fields, and flow sequence.** Every route and interaction in §6 below is pulled directly from these two files. If a screen isn't in one of these documents, it isn't in scope for the initial build. **Their original inline CSS (colors, typography, surfaces) is superseded — see the Doctrine below, which wins on all visual styling.**
- `UI-UX Doctrine/Epicenter_Education_UIUX_Doctrine_V1_Final.html` — **the definitive, final source of truth for all visual identity, interaction quality, component behavior, and accessibility.** Epicenter Yellow (`#EDC001`) / white (`#FDFDFD`) / black (`#000000`), Satoshi typography, the full semantic/status token set, glassmorphism rules, motion rules, and the role-specific (Counsellor/Student/Admin) experience doctrine all live here. Where this Doctrine conflicts with the storyboards' original colors, fonts, spacing, surfaces, or interaction styling, **the Doctrine wins outright** — this is a deliberate, explicit supersession, not a partial one. Where it conflicts with the storyboards' approved screen order or purpose, the storyboards win unless the Product Owner changes that flow.
- `UI Inspiration/` — the **mandatory** visual reference library the Doctrine requires Claude Code to open before and during every screen build (Doctrine §3.2). Not passive inspiration: identify the closest example, build the screen against it, translate it into Doctrine tokens, then re-open the reference and compare after the first implementation pass. Login and Onboarding are fidelity-reference pages — replicate the closest approved example closely, not loosely.

**Confirmed via the architecture clarification round** (this document reflects the answers, not a menu of options):

| Decision | Choice |
|---|---|
| Frontend | Next.js (React + TypeScript) |
| Backend | Node.js/TypeScript, same repo as frontend |
| Database / BaaS | Supabase (Postgres + Auth + Storage + Row-Level Security) |
| Authentication | Custom email/password (Supabase Auth) for the pilot; Microsoft Entra ID SSO deferred to a later milestone, same treatment as OneDrive below |
| Hosting | Vercel |
| File storage | Supabase Storage now; Microsoft OneDrive/Graph API is a defined later milestone, not v1 |
| LLM provider | Google Gemini 2.5 Flash, via the Google API, behind an internal abstraction |
| Multi-tenancy | Single-tenant for the pilot; no `school_id` scoping yet, revisit if a second school is ever onboarded |
| Testing | Full pyramid — unit, integration, and E2E |
| Environments | Dev + Production |
| Design system | Lightweight shared component set implementing the **Epicenter Education UI/UX Doctrine V1** (Epicenter Yellow `#EDC001` / white `#FDFDFD` / black `#000000`, Satoshi typography, full semantic token set), built on **Tailwind CSS + shadcn/ui (Radix primitives)** |
| Repo structure | Single monorepo |
| Dev tooling | MCP servers + Claude Code Skills, confirmed in `MCP_and_Skills_Setup_Guide_v1.md` — see §11 below |

**On the UI library choice:** this wasn't asked as a standalone question, but it falls out of decisions already made — the shadcn MCP (in the confirmed tooling list, §11) installs shadcn/ui components, and the three design-taste skills in use (`emil-design-eng`, `impeccable`, `taste-skill` — the merged `design-taste` skill is not in use, see §11) assume a Tailwind/shadcn/Radix stack in their rules. Building `packages/ui` on anything else would mean those tools don't actually apply. Flagged here as a default worth confirming (same treatment as the other unasked defaults in §10), not a silent scope change — the underlying decision ("lightweight shared component set implementing the Doctrine") is unchanged; this just names the concrete library that set gets built on. Default shadcn styling must never ship unchanged, per Doctrine §39 — every primitive inherits Epicenter tokens, typography, radius, spacing, shadows, focus states, and accessibility behavior.

**Reconciling `UI Inspiration/` with the Doctrine:** the storyboards' *original* inline CSS (the warm terracotta/rose/teal palette and system-font stack in the v3 `<style>` blocks) is fully superseded — it is historical, not to be ported anywhere. The **`UI-UX Doctrine/Epicenter_Education_UIUX_Doctrine_V1_Final.html`** file is the single source of truth for every visual token. The `UI Inspiration/` folder's reference images (dashboard, onboarding, calendar, login, profile) remain in active use, but only as **composition/interaction** references per Doctrine §3.2 — page proportions, spacing rhythm, card treatment, field placement, glass-surface layering, navigation behavior — never as a color or typography source. Every one of those references gets re-skinned in Doctrine tokens, not reproduced in its original color scheme.

**Tailwind config — build from the Doctrine, not the storyboard.** When `packages/ui` gets built (Phase 1, before any component is generated), port these Doctrine tokens into `tailwind.config.ts`:

```ts
// Core (Doctrine §6)
colors: {
  yellow:        '#EDC001',   // brand-yellow — primary actions, selected emphasis, progress. Never large backgrounds/text blocks/errors.
  paper:         '#FDFDFD',   // surface-primary — main app background
  ink:           '#000000',   // ink-primary — primary text, secondary brand identity
  'surface-raised': '#FFFFFF',
  'surface-muted':   '#F5F5F2',
  'surface-subtle':  '#FAFAF7',
  'border-soft':     '#E8E8E2',
  'border-strong':   '#D7D7CF',
  'ink-secondary':   '#5F5F59',
  'ink-tertiary':    '#85857E',
  'disabled-surface': '#F0F0EC',
  'disabled-ink':      '#9A9A94',
  // Semantic (Doctrine §7) — bg/border/ink triplets
  complete: { bg: '#EAF2E9', border: '#C9DDC8', ink: '#49684D' },
  overdue:  { bg: '#F8E9E7', border: '#E8C4C0', ink: '#8A413B' },
  pending:  { bg: '#F1E9E9', border: '#DDCECF', ink: '#73595C' },
  reach:    { bg: '#FFF5C7', border: '#ECD978', ink: '#695600' },
  target:   { bg: '#EAF1F8', border: '#C8D8E8', ink: '#365A79' },
  safety:   { bg: '#EAF2E9', border: '#C9DDC8', ink: '#45664A' },
  error:    { bg: '#F8E7E5', border: '#E5B8B3', ink: '#8D352E' },
},
fontFamily: { sans: ['Satoshi', 'Helvetica Neue', 'Arial', 'sans-serif'] }, // load via Fontshare, per Doctrine §9.1 — no second typeface
borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '24px', pill: '999px' }, // Doctrine §11.1
```

**AI marker — corrects an earlier draft of this project.** Every prior mention of a violet `.ai-badge` (`#6E62E5` / `#EFEBFC`) in this document set, including the AI Integration specs, is **wrong and superseded**. Per Doctrine §7.10 and §35.7, AI-assisted content uses a **minimal black marker** ("AI-assisted" / "AI-generated" label, sparkle icon, neutral surface) — factual, not magical, no gradient, no violet, no promotional styling. `packages/ui`'s AI badge component must be built against this black treatment from the start.

**Glass tokens** (Doctrine §12.2, starting values, implement as shared tokens): background `rgba(255,255,255,.72)`, backdrop blur `12–18px`, border `1px solid rgba(0,0,0,.08)`, shadow `0 8px 30px rgba(0,0,0,.06)`. Used for selected navigation, floating utility controls, context panels, modals/drawers — never on every card (Doctrine §12.4).

---

## 1. High-Level System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    Next.js app (Vercel)                    │
│  ─ Server Components / Route Handlers (API layer)          │
│  ─ Client Components (dashboard, panels, wizards)           │
│  ─ Supabase Auth, email/password (pilot-stage login)         │
└───────────┬───────────────────────────────┬─────────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│   Supabase (Postgres)      │   │   Google Gemini 2.5 Flash API   │
│  ─ RLS-enforced tables      │   │   (server-side only, via an     │
│  ─ Supabase Storage          │   │    internal `lib/ai/*` layer)   │
│  ─ Realtime (optional, v2+) │   └───────────────────────────────┘
└───────────────────────────┘
            │
            ▼ (later milestone, not v1)
┌───────────────────────────┐
│  Microsoft Entra ID (SSO)   │
│  Microsoft Graph API        │
│  (OneDrive/SharePoint)      │
└───────────────────────────┘

Optional per-user connectors (student/counsellor initiated, off by default):
  Google Calendar API  ·  Microsoft Forms embed  ·  Google Forms API

Dev-time only (not part of the running app — see §11):
  Supabase MCP · Playwright MCP · Context7 MCP · Semgrep MCP
  Sequential Thinking MCP · a11y-mcp · Chrome DevTools MCP · GitHub MCP
  shadcn MCP · Google Calendar/Workspace MCP (dev-time credential testing)
  Vercel CLI (deploy/status/logs — CLI, not an MCP, per your preference)
```

**Why email/password now, Entra ID later:** the school's Microsoft tenant setup, app registration, and claims mapping (role, department, student ID) are real integration work worth doing once, deliberately, rather than as a blocker to testing the rest of the product. Supabase Auth's email/password flow is a few lines of config and lets every screen in §6 get built and tested immediately. When Entra ID is ready to wire up, `users.entra_id` (already in the data model in §2) is the join key — accounts created via email/password now can be migrated to Entra ID-backed accounts later without changing any other table, since every other table already references `users.id`, not the auth method.

---

## 2. Data Model

Single-tenant (no `school_id` column for v1, per the confirmed decision — but every table should still have an explicit primary key strategy that wouldn't make adding `school_id` later a rewrite, i.e. avoid assuming global uniqueness of things like email across a hypothetical future second school).

**Core identity & profile**
- `users` — id (matches Supabase Auth's `auth.users.id`), entra_id (nullable for now — populated once Entra ID SSO is wired up later), email, full_name, role (`admin` | `head_of_counselling` | `counsellor` | `student`), created_at. Password itself is never stored in this table — Supabase Auth owns the credential, this table just holds the profile/role data everything else joins against.
- `student_profiles` — user_id (FK), grade (11|12), subjects (jsonb array), age, intended_major, hobbies (jsonb array of tags), extracurriculars (jsonb array of {activity, role, duration}), preferred_countries, career_interest, test_scores (jsonb), assigned_counsellor_id (FK → users), onboarding_completed_at (nullable — null means skipped/incomplete), onboarding_current_step (int, for resume).
- `counsellor_caseloads` — counsellor_id, student_id, assigned_at, reassigned_from (nullable, for handoff history).

**Notes**
- `notes` — id, student_id, author_id, visibility (`shared` | `private`), type (`meeting` | `student_update`), raw_text, final_text, ai_cleaned (bool), created_at. `raw_text` is retained even after clean-up is approved, per the AI spec's recommendation — never shown in the UI, but queryable for audit.

**Roadmap & tasks**
- `roadmap_milestones` — id, student_id, title, template_source (nullable, which template it was bulk-assigned from).
- `tasks` — id, milestone_id, student_id, title, category (`academic` | `ec` | `essay` | `testing` | `documents_admin` | `other`), assignee (`student` | `counsellor`), status (`not_started` | `in_progress` | `pending_review` | `complete`), due_date, evidence_url (nullable), evidence_comment (nullable), confirmed_by (FK → users, nullable), confirmed_at (nullable).

**Shortlist & applications**
- `shortlist_entries` — id, student_id, university_name, course, country, deadline, category (`reach` | `target` | `safety`, nullable until a counsellor sets it), status (`awaiting_review` | `suggested` | `approved`), suggested_by (`student` | `counsellor`).
- `student_priorities` — student_id, top_priority, location_pref, financial_aid_needed (bool), culture_pref — the "what I want out of my list" fields; explicitly not fed into any matching algorithm, just displayed.
- `applications` — id, shortlist_entry_id, student_id, status (offer/decision lifecycle: `preparing` | `submitted` | `interview_requested` | `offer_received` | `rejected`), decision (`accepted` | `declined`, nullable), offer_conditions, deposit_deadline.
- `application_requirements` — id, application_id, title, requirement_type (`essay` | `transcript` | `recommendation` | `form` | `other`), status (`awaiting_student` | `submitted_awaiting_confirmation` | `needs_revision` | `complete`), ai_extracted (bool), submitted_at, confirmed_by (FK → users, nullable), confirmed_at.

**Documents** — modeled as a property of what they support, not a standalone entity with its own page (per the IA's contextual-documents decision): document metadata lives on `tasks.evidence_url` / `application_requirements` submission fields, backed by Supabase Storage object paths. A lightweight `documents` table can still exist for audit trail (id, owner_id, storage_path, linked_task_id nullable, linked_requirement_id nullable, uploaded_at) even though there's no dedicated "Documents" page.

**Meetings & calendar**
- `calendar_events` — id, student_id, counsellor_id, title, starts_at, ends_at, google_synced (bool), google_event_id (nullable).
- `google_calendar_connections` — user_id, access_token (encrypted), refresh_token (encrypted), sync_direction settings (two toggles from UC9: show Google events in Epicenter, push Epicenter events to Google).

**Forms**
- `forms` — id, created_by, title, source (`native` | `microsoft_forms` | `google_forms`), external_form_id (nullable, for MS/Google), questions (jsonb).
- `form_assignments` — form_id, student_id, status (`sent` | `responded`).
- `form_responses` — form_id, student_id, answers (jsonb), submitted_at.

**AI infrastructure** (from `AI_Integration_Flow_Plan_v1.md` §3)
- `student_signals` — student_id, category, tag_text, source_note_id (FK, nullable), extracted_at. Powers the category-aware nudge without a live LLM call per task creation.
- `risk_flags` — id, student_id, type (`grade_drop` | `pace_lag`), trigger_snapshot (jsonb — the specific checkpoints/dates that caused it), dismissed_at (nullable), dismissed_by (nullable).
- `stalled_task_alerts` — id, task_id, flagged_at, dismissed_at (nullable), dismissed_by (nullable).
- `reassignment_snapshots` — id, student_id, generated_for_counsellor_id, content (text, the AI-generated handoff summary), generated_at. Permanent, not deleted after first view.
- `ai_action_log` — id, feature (`clean_up` | `nudge` | `digest` | `risk_flag` | `reassignment_snapshot` | `stalled_alert` | `essay_feedback` | `checklist_extraction` | `meeting_prep` | `onboarding_extraction`), student_id, actor_id, input_ref, output_text, reviewed_by (nullable), edited_before_save (bool), created_at.

---

## 3. Permission Model (enforced via Postgres Row-Level Security, not just app-layer checks)

Translating the PRD's §13 permission matrix and the private/shared note distinction into RLS is the single highest-stakes piece of this build — a private note leaking to a student, or one counsellor seeing another's caseload without cause, is the kind of bug that ends a pilot. Enforce at the database layer so a bug in a single API route can't accidentally expose something an RLS policy would have blocked anyway.

- **Students**: `SELECT`/`UPDATE` on their own `student_profiles` row and their own child rows (tasks, notes, shortlist, applications) only. `notes` policy explicitly excludes rows where `visibility = 'private'`. No `INSERT` on `tasks` or `roadmap_milestones` (create rights stay with the counsellor) — students can only `UPDATE` status/evidence on existing tasks assigned to them.
- **Counsellors**: full CRUD on rows where `student_profiles.assigned_counsellor_id = auth.uid()`. No access to other counsellors' caseloads by default.
- **Head of Counselling**: read access across all caseloads (for the Team view and reassignment), write access to `counsellor_caseloads` (the reassignment action itself).
- **Administrator**: write access to `users` and `student_profiles` base fields (grade, subjects) at creation time only — not meeting notes, roadmap, or shortlist content.

Every AI feature that reads a `StudentContextBundle` (per the AI Integration Flow Plan) must run through the same RLS-scoped connection as a normal request — this is what actually guarantees "no cross-student intelligence," not a prompt instruction.

---

## 4. AI Implementation Notes

Updates to `AI_Integration_Flow_Plan_v1.md` given the confirmed provider:

- **Provider**: Google Gemini 2.5 Flash via the Google Generative AI API, called server-side only (Route Handlers / server actions), never from the client. API key lives in Vercel environment variables, never exposed to the browser.
- **Abstraction layer**: `lib/ai/client.ts` wraps every Gemini call behind feature-specific functions (`cleanUpNote()`, `extractSignals()`, `generateDigest()`, `extractOnboardingTags()`, `generateEssayFeedback()`, `extractRequirementChecklist()`, `generateMeetingPrep()`, `generateHandoffSnapshot()`) — each one owns its own prompt template, not a single generic "call the LLM" function. This keeps prompts reviewable/testable individually and makes swapping providers later a change in one file, not every call site.
- **Signal extraction stays async**, triggered on note save (a Supabase Edge Function or a Vercel background job), writing to `student_signals` — the nudge feature (§4.3 of the Flow Plan) reads that table directly and should not call Gemini synchronously on every task-creation click.
- **Digest/risk-flag/stalled-alert phrasing uses a live Gemini call** (confirmed decision), but the underlying *detection* logic (who's inactive, which checkpoint dropped, which task is stalled) is plain SQL/rule-based — Gemini only turns already-true facts into a sentence, per the grounding rule in the Flow Plan.
- **Cost/latency guardrails worth building even for a pilot**: cache essay-feedback-first-pass and meeting-prep output per draft-version/meeting-id (confirmed decisions from the Flow Plan) so re-opening the same panel doesn't re-call the model. Rate-limit the dashboard digest to once-per-session rather than once-per-render.

---

## 5. Third-Party Integrations

| Integration | Status in v1 | Notes |
|---|---|---|
| Supabase Auth (email/password) | **v1, required** | Primary login for every role during the pilot/testing phase. |
| Microsoft Entra ID (auth) | **Not v1 — later milestone** | Deferred alongside OneDrive; `users.entra_id` reserved in the schema so migration doesn't require a data-model change. |
| Supabase Storage | **v1, required** | Stands in for document storage until OneDrive milestone. |
| Google Gemini API | **v1, required** | Internal AI calls only — invisible to end users. |
| Google Calendar | **Tentative — moved to end of build, not scheduled** | Originally scoped in UC9 as v1/optional. Pulled from the initial build after the Google OAuth setup hit a real `HTTP 404` failure during MCP registration — deferred as a whole feature (not just the Google-specific piece) rather than debugged mid-build. See Build Runbook's "Tentative Addition" section. |
| Microsoft Forms | **Tentative — moved to end of build, not scheduled** | One of three creation paths in the Forms feature; the whole Forms feature (all three paths, including this one which doesn't need Google OAuth) was deferred together with Calendar since they were built as one combined stage. |
| Google Forms | **Tentative — moved to end of build, not scheduled** | The other external Forms path; requires Google OAuth scoped to Forms API, separate from the Gemini API key — same OAuth setup issue as Calendar. |
| Microsoft OneDrive / Graph API | **Not v1 — defined future milestone** | PRD's actual commitment; deferred per the confirmed storage decision. Build `documents` storage behind an interface now so swapping the backend later doesn't touch calling code. |

---

## 6. Screen-by-Screen Build Manifest

Pulled directly from the two v3 storyboards. Each entry is a real route/component to build, not a suggestion — if a screen below isn't built, a use case from the PRD isn't actually supported yet.

### Counsellor App (`/counsellor/...`)

**Global shell**: topbar (search, notifications, calendar, profile icons) + sidebar (Dashboard, Students, Applications Centre, Internal Notes, Reports, Forms, My Calendar; Team instead of Students for Head of Counselling).

| Route | Screens covered (storyboard reference) | Key data |
|---|---|---|
| `/counsellor/dashboard` | UC1 Screen 1 (Dashboard + AI digest) | Live digest (Gemini call), pending-confirmation count, upcoming deadlines, inactive students |
| `/counsellor/students` | UC1 Screens 2–3, UC2 Screen 1 | Student grid, multi-select mode for bulk actions |
| `/counsellor/students/[id]` (Overview tab) | UC1 Screens 3–5, 8; UC3 Screens 1, 3–4 | Profile completion, Edit Profile panel, risk-flag card + dismiss |
| `/counsellor/students/[id]` (Meeting Notes tab) | UC1 Screens 6–8 | Raw note composer, Clean Up with AI, shared/private note list |
| `/counsellor/students/[id]` (Roadmap tab) | UC2 Screens 3–11 | Milestone/task list, + Add Task (category + nudge), tick-then-confirm, stalled-task alert + dismiss |
| `/counsellor/students/[id]` (Shortlist tab) | UC4 all screens | Priorities card, + Add University, category/status pills |
| `/counsellor/students/[id]` (Applications tab) | UC5 all screens | Convert-to-application, Paste Requirements → extract → save |
| `/counsellor/students/[id]` (Documents tab) | UC7 all screens | Doc row list, Review & Feedback panel (AI first-pass), status |
| `/counsellor/applications` | UC5 Screen 3 | Cross-caseload Applications Centre list |
| `/counsellor/team` (Head of Counselling only) | UC6 all screens | Caseload bars, Reassign panel, checklist rows |
| `/counsellor/students/[id]` (post-reassignment Overview) | UC6 Screen 4 | Permanent Handoff Summary card |
| `/counsellor/forms` **(Coming Soon stub built Phase 2; full feature is tentative, not scheduled)** | UC10 all screens | Form list, Create Form (native/MS/Google path), embedded preview, response tally |
| `/counsellor/calendar` **(Coming Soon stub built Phase 2; full feature is tentative, not scheduled)** | UC9 all screens | Month/Week views, Connect Google Calendar, sync toggles, Prep Notes, meeting-note composer with "also add to Google Calendar" |

### Student App (`/student/...`)

**Global shell**: top pill-nav (Home, Notes, College Shortlist, My Application, Roadmap, My Profile) + search/calendar/profile icons.

| Route | Screens covered | Key data |
|---|---|---|
| `/login` → `/onboarding` | SU1 Screens 1–8 | 6-step wizard, skippable/resumable, AI tag extraction on 3 steps |
| `/student/home` | SU1 Screens 9–11 | Sparse first dashboard, established-state dashboard, skip/resume banner |
| `/student/profile` | SU2 all screens | Post-onboarding preferences, Edit My Preferences (countries/career/test scores), Add an Update |
| `/student/roadmap` | SU3 all screens | Milestone/task list, evidence upload with real thumbnail, submit-for-review state |
| `/student/shortlist` | SU4 all screens | Suggest a University (no category selector), status pills, Setting My Priorities panel |
| `/student/notes` | SU5 all screens | Shared notes only (private invisible by RLS, not by UI hiding), Add an Update with light AI clean-up |
| `/student/application` | SU6 all screens | Requirement list, re-upload flow, submitted/awaiting-confirmation state |
| `/student/application` (offer state) | SU7 all screens | Offer details, Accept/Decline, confirmed state |
| `/student/home` (form to-do) → form modal **(full feature is tentative, not scheduled — no stub needed here since the to-do card simply doesn't render until real forms exist)** | Form flow Screens 1–3 | Form appears as a to-do card, embedded fill-out, submitted state |

---

## 7. Non-Functional Requirements

- **Testing**: unit tests (Vitest) for permission logic, status-transition logic (tick-then-confirm, requirement lifecycle), and AI-output-to-UI mapping (never trust the model's raw output shape without a validating layer). Integration tests against a seeded Supabase test project. E2E (Playwright, driven interactively during development via the **Playwright MCP**, §11): **one test per major screen or flow built in every stage**, not just the flagship ones — see `Product Context/Build_Runbook_v1.md` for the exact per-stage list. The private/shared note visibility boundary and the AI drafts-vs-passive split remain the two highest-value tests in the whole app and are never optional, but they're the floor, not the ceiling, of E2E coverage.
- **Environments**: `dev` (Vercel preview + a separate Supabase project seeded with fake students) and `production` (real pilot data). No staging tier for v1, per the confirmed decision — acceptable at this scale, revisit if the pilot expands.
- **Monitoring**: Sentry for error tracking on both client and server, wired in as one of the first things built (Build Runbook Stage 0), not a later add-on — real student data flowing through this makes silent failures unacceptable. Sentry is **verified, not just installed, at the end of every stage**: a deliberate test error is triggered and its capture confirmed via the **Sentry MCP** (§11) before that stage's PR is opened. This includes deliberately verifying AI-call failures surface correctly once the AI layer (Phase 5) exists.
- **CI**: GitHub Actions running lint + unit + integration tests on every PR; Vercel handles preview deploys automatically per branch. **Semgrep MCP** (§11) runs as part of the normal dev loop, ideally mirrored in CI, given how much this app's integrity depends on the RLS/permission boundary.
- **Secrets**: Vercel environment variables for the Gemini API key, Entra ID client secret, and Google OAuth credentials (Calendar/Forms) — never committed, never exposed client-side.
- **Accessibility/browser support**: desktop/laptop only, matching the PRD's explicit V1 scope (no mobile app). Standard modern-browser support (Chrome/Edge/Safari latest two versions) is sufficient — no legacy browser support needed for a single pilot school. Basic accessibility hygiene (color contrast, ARIA, WCAG 2a/2aa) is checked via the free **a11y-mcp** (§11) as a dev-loop habit even though full compliance auditing isn't a stated pilot requirement — cheap to check, expensive to retrofit.

---

## 8. Repo Structure (Monorepo)

```
Epicenter-Architecture/    — real repo name; every project/resource created for this build (Supabase, Sentry, Google Cloud, etc.) is named epicenter-architecture, not epicenter-education
  CLAUDE.md                — project brief + phased build guide for Claude Code (see companion file)
  .mcp.json                — project-scoped MCP config, committed to git (see §11 / setup guide)
  apps/
    web/                  — Next.js app (both counsellor and student surfaces, role-gated routing)
                             — components.json here once shadcn MCP is initialized (§11, Phase 1)
  packages/
    ui/                   — shared component library (pills, cards, panels, the AI badge, task rows)
                             — built on Tailwind + shadcn/ui, themed from the UI/UX Doctrine's tokens (§0) — black AI badge, not the old violet spec
    db/                   — Supabase schema, migrations, RLS policies (source of truth for §2/§3)
    ai/                   — Gemini abstraction layer (lib/ai/* from §4), one file per feature
    config/                — shared TypeScript/ESLint config
  tests/
    e2e/                   — Playwright specs
  .github/workflows/       — CI
  .claude/skills/          — project-specific + installed design-taste skills (emil-design-eng, impeccable, taste-skill — §11)
```

---

## 9. Suggested Build Phases

**Standards applied to every phase below** (see the Build Runbook for exactly where): Caveman mode on by default for the whole build; Sentry verified — not just installed — at the end of every stage; Graphify's index refreshed at the end of every stage; one Playwright E2E test per major screen/flow built in that stage.

1. **Foundation**: Supabase Auth email/password wired up; core data model + RLS policies; shared UI component package scaffolded from the **UI/UX Doctrine's tokens** (§0 — Epicenter Yellow/white/black, Satoshi, semantic states, glass tokens, black AI marker) on Tailwind + shadcn/ui, cross-checked against `UI Inspiration/` for composition; Sentry SDK wired with a test-error verification route. *Tooling*: Supabase MCP (schema/migrations), shadcn MCP (component install, once `components.json` exists), the design-taste skills (apply from the very first component so nothing needs a later retrofit), Sequential Thinking MCP (useful for the RLS-policy design itself, which is the highest-stakes piece of this phase), Sentry MCP.
2. **Counsellor core**: global shell (topbar + full sidebar nav, every item routes somewhere real), Students grid, Overview/Profile, Meeting Notes (without AI clean-up yet), Roadmap/Tasks (without nudge/AI yet) — get the tick-then-confirm status machinery right before layering AI on top of it. Forms and My Calendar get genuine "Coming soon" stub pages here (on-brand, no dead links) since the full features are a tentative addition, not part of this phase. *Tooling*: Playwright MCP (an E2E test for Students grid, Profile editing, Meeting Notes, and the tick-then-confirm cycle, each as it's built, not after), Context7 MCP (Next.js/Supabase API lookups).
3. **Student core**: Onboarding wizard (without AI extraction yet — plain form first), Home dashboard, My Profile, Roadmap (student side), Notes. *Tooling*: same as Phase 2, plus a11y-mcp (the onboarding wizard is the single most form-heavy, most accessibility-sensitive flow in the app).
4. **Shortlist & Applications**: both sides, including the requirement lifecycle and tick-then-confirm for submissions. *Tooling*: Playwright MCP, Semgrep MCP (this phase adds several new write paths worth scanning).
5. **AI layer**: wire in Gemini for clean-up, nudges (+ signal extraction job), onboarding extraction, digest, risk flagging, stalled alerts, essay feedback, checklist extraction, reassignment snapshot, meeting prep — each behind its own `lib/ai/*` function per §4, added one feature at a time against the now-stable non-AI product. *Tooling*: Sequential Thinking MCP (comparing prompt/grounding approaches per feature), Graphify (by now the codebase has enough structure — `student_signals`/`AIActionLog`/`StudentContextBundle` relationships span many files — for it to actually pay off). Note: the Meeting Prep function built here hooks into the Calendar screen, which is now Phase 7 below (tentative) — build the function regardless, wire the button whenever Calendar happens.
6. **Team & Reassignment**: Head of Counselling views, reassignment flow, handoff snapshot. *Tooling*: nothing new — same stack as Phases 2–4.
7. **Later milestone (not part of initial build)**: Microsoft Entra ID SSO migration (replacing email/password) and Microsoft OneDrive/Graph API storage migration (replacing Supabase Storage) — both deferred integrations, tackled together since they're both Microsoft-tenant setup work. *Tooling*: revisit the Microsoft Graph/Entra MCP question at this point (deferred, not yet evaluated).

**Tentative addition (not scheduled, may implement later) — Calendar & Forms:** My Calendar with optional Google sync; Forms with all three creation paths. Originally Phase 6 of this list — pulled out entirely, not just deprioritized, after the Google Calendar MCP registration failed with an `HTTP 404` during setup (the documented endpoint doesn't work as-is). Distinct from Phase 7 above: Phase 7 is a committed later milestone, this is genuinely optional and undated. If picked up: verify a working Google OAuth setup first (see `MCP_and_Skills_Setup_Guide_v1.md`), then treat it as its own stage with the same git discipline as everything else, per the Build Runbook's "Tentative Addition" section.

Chrome DevTools MCP, GitHub MCP, and Sentry MCP aren't tied to a single phase — bring each one in the moment its trigger condition is met (a running app to profile, the repo hosted on GitHub, Sentry wired into the app) per §11/`MCP_and_Skills_Setup_Guide_v1.md`.

---

## 10. Open Items / Defaults Worth Confirming

- Entra ID tenant configuration varies school to school — when that milestone comes up, budget time for a short spike on the Entra ID ↔ Supabase Auth migration path specifically, since existing email/password accounts need to map onto real school identities without losing any data.
- Sentry, GitHub Actions, and the specific env split (dev/production) in §7 were added as sensible defaults, not explicitly requested — flag if you'd rather skip any of them for the pilot.
- Google Calendar and Forms (all three creation paths) are no longer part of the initial build — moved to a tentative, undated addition after the Google Calendar MCP's documented endpoint returned `HTTP 404` on registration. Whoever picks this back up needs to verify a real working Google OAuth setup before any of that work resumes; the setup guide's Google Calendar/Forms section needs re-validation, not just re-running.
- The Tailwind + shadcn/ui choice in §0 is a default reconciling the design-system decision with the confirmed MCP/skill toolchain (shadcn MCP, the three design-taste skills in use) — flag if a different component foundation is actually wanted.
- **Resolved, no longer open**: the visual identity question. The UI/UX Doctrine V1 (9 July 2026) is now the binding source of truth for every color, typeface, spacing, surface, and interaction-quality decision, fully superseding the storyboards' original inline CSS. This closes the ambiguity that existed while only the storyboards' CSS existed as a styling reference.

---

## 11. Development Tooling — MCPs & Skills

Full rationale and exact setup commands live in two companion documents in this folder: `MCP_and_Skills_Reference_v1.md` (what each tool is and why it's relevant) and `MCP_and_Skills_Setup_Guide_v1.md` (the confirmed final list, ordered, with install commands and phase gating). This section is the short version, for orientation inside this document.

**Set up now:** Supabase MCP, Playwright MCP, Context7 MCP, Semgrep MCP, Sequential Thinking MCP, a11y-mcp, Chrome DevTools MCP, Sentry MCP, GitHub MCP, shadcn MCP (registered inside Build Runbook Stage 0, not manually), the `security-review` and `skill-creator` built-in skills, Caveman, Graphify, and the three design-taste skills in use (`emilkowalski/skills`, `impeccable`, `taste-skill`). Deployment work goes through the **Vercel CLI**, not an MCP — see the setup guide §4.

**Pulled from "set up now" — tentative, not currently scheduled:** Google Calendar MCP and the Google Workspace/Forms MCP. The Google Calendar MCP's documented endpoint returned `HTTP 404` on registration during actual setup — rather than debug it mid-build, the whole Calendar & Forms feature (not just the broken piece) moved to a tentative, undated addition at the end of the Build Runbook. If already registered, remove with `claude mcp remove google-calendar --scope project` and `claude mcp remove google-workspace --scope project`.

**The one item that genuinely can't be set up yet:** the custom Epicenter-conventions skill — it needs real code and conventions to encode. Originally deferred all the way to Stage 5, now moved up to the end of Build Runbook **Stage 2** (Prompt 2.9): by then the Doctrine's tokens/AI-badge rule, the tick-then-confirm pattern, and the RLS boundary are all real, committed code, which is enough to author it — no reason to make Stages 3-6 wait for reinforcement that could start three stages earlier.

**Confirmed not in use for this project** (evaluated, deliberately not installed — see the setup guide's Part C for the full list and reasoning): Figma MCP, Magic MCP (21st.dev), Linear MCP, Notion MCP, Resend MCP, PostHog MCP, Deque's paid axe MCP, the merged `design-taste` skill (using the three individual design-taste skills instead), the Vercel MCP (using the Vercel CLI instead), and the Microsoft Graph/Entra ID MCP (deferred to Phase 7 alongside the SSO/OneDrive migration itself).
