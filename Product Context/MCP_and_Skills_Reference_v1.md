# Epicenter Education — MCP & Skills Reference v1

Companion to `Epicenter_Education_Architecture_v1.md`. This is a rundown of MCP servers and Claude Code Skills relevant to building this app. Nothing here touches CLAUDE.md — that's a separate, later step.

One note before the list: your phrase "graphyify caveman" wasn't clear to me. I've covered the adjacent categories that seemed most likely — diagramming/visualization (Mermaid) and design-to-code (Figma) — but if you meant a specific named tool, tell me and I'll add it.

Each entry: what it does, why it matters for *this* build specifically, and whether to set it up now or defer.

## 1. Database & Backend — Supabase MCP

Official server, maintained by Supabase, [listed as an official Claude connector](https://supabase.com/blog/supabase-is-now-an-official-claude-connector) as of Feb 2026. 32 tools: runs SQL, designs/modifies tables, lists schemas, generates TypeScript types from your Postgres schema, and gives security recommendations. Auth is OAuth (no PAT needed).

Why it matters here: your entire data model (§2 of the architecture doc — `users`, `student_profiles`, `notes`, `roadmap_tasks`, `applications`, `ai_action_log`, etc.) lives in Supabase Postgres. This MCP lets Claude Code create migrations, inspect the live schema, and generate types directly — no manual round-trip through the Supabase dashboard. The built-in "security recommendations" tool is a natural fit for your RLS-first permission model (§3), where the private/shared note boundary is enforced at the policy level, not the app level.

Setup now. Recommend running it in `read_only` mode day-to-day and switching to read-write only when actually authoring migrations, since it can execute arbitrary SQL against your real database.

Source: [Supabase MCP Docs](https://supabase.com/docs/guides/ai-tools/mcp) · [GitHub](https://github.com/supabase-community/supabase-mcp)

## 2. Browser Testing & QA — Playwright MCP

Official, maintained by Microsoft under the Playwright license, published to the official MCP Registry. Drives a real browser via accessibility snapshots (not screenshots/vision), so it can navigate, click, fill forms, and assert on page state without a vision model.

Why it matters here: you confirmed "full testing pyramid" including E2E via Playwright (§7 of the architecture doc), and flagged the private/shared note visibility boundary as the single most important E2E test in the app. This MCP lets Claude Code write and run those Playwright tests interactively during development, not just generate test files blind — it can actually load the app, log in as a student vs. a counsellor, and verify what each role can and can't see.

Setup now, alongside the E2E test suite.

Source: [GitHub](https://github.com/microsoft/playwright-mcp)

## 3. Browser Debugging & Performance — Chrome DevTools MCP

Official, Google-maintained, Apache-2.0. Distinct from Playwright MCP — this one is for debugging and performance, not test authoring. Gives an agent access to the Console, Network panel, and Performance trace recorder inside a real Chrome instance.

Why it matters here: useful once the app has real screens running — e.g. tracing why the counsellor dashboard's daily digest query is slow, or checking actual network calls when wiring the Gemini API calls client-side vs. server-side. Less central than Playwright, but good to have during active development and any performance passes before the pilot goes live.

Setup when you start integration/performance work — not needed on day one.

Source: [GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)

## 4. Deployment — Vercel CLI (not the MCP)

**Decision: using the Vercel CLI instead of the Vercel MCP.** The MCP (official, Public Beta, read-only) does exist and would let an agent search Vercel's docs and inspect deployments/logs — but you've chosen the CLI (`npm install -g vercel`, `vercel login`, `vercel link`) instead, which Claude Code can drive directly via Bash for the same deployment/status/log-checking tasks, without a separate registered MCP server. Functionally similar outcome, one fewer server in the tool list.

Source: [Vercel CLI Docs](https://vercel.com/docs/cli)

## 5. Error Monitoring — Sentry MCP

Official, maintained by Sentry (getsentry), OAuth-based, no API key needed. Lets an agent list and inspect issues, pull stack traces, search issues in natural language, and triage (resolve/assign/archive).

Why it matters here: Sentry is already named in your architecture doc's non-functional requirements (§7) as the error-monitoring tool. Once it's wired into the Next.js app, this MCP means Claude Code can pull a real production stack trace and go straight to a fix, rather than you copy-pasting error text back and forth.

Setup once Sentry itself is wired into the app (not needed before that — nothing to monitor yet).

Source: [GitHub](https://github.com/getsentry/sentry-mcp) · [mcp.sentry.dev](https://mcp.sentry.dev/)

## 6. Documentation Lookup — Context7 MCP

Maintained by Upstash. Fetches current, version-specific docs and code examples for a library straight into context, instead of relying on the model's training data (which goes stale, especially for fast-moving libraries).

Why it matters here: your stack is Next.js + Supabase + TypeScript + Tailwind, all of which change frequently enough that training-data knowledge drifts. This is most useful for exactly the kind of "wait, did the Next.js App Router API change again" questions that come up constantly in a build like this. Trigger it explicitly in prompts with "use context7," or configure it to auto-attach for your core libraries.

Setup now — free tier is enough for a single-pilot build; only worth an API key if usage climbs.

Source: [GitHub](https://github.com/upstash/context7)

## 7. Design-to-Code — Figma MCP

Official, currently free during beta (will become usage-based). Exposes Figma frames, components, design tokens, and layout constraints as structured data; an agent then writes the actual code from that data (Figma MCP itself doesn't generate code).

Why it matters here: you have a full `UI Inspiration/` folder of reference screenshots and the two v3 flow-storyboard HTML files, which are effectively your design source of truth already. If at any point you move the storyboard designs into an actual Figma file (e.g. to get real component/token structure before the build, rather than working straight from static HTML), this MCP is how Claude Code would read that Figma file back into working React/Tailwind components. If you stay with the HTML storyboards as the design source (as you have so far), this isn't needed — Claude Code can already parse the storyboard HTML directly.

Defer — only relevant if you formalize designs in Figma. Not needed to start the build.

Source: [Figma Developer Docs](https://developers.figma.com/docs/figma-mcp-server/)

## 8. UI Component Generation — Magic MCP (21st.dev)

Generates React/TypeScript components from natural-language descriptions, built on shadcn/ui + Tailwind + Radix — which is the same general design-system tier you confirmed for this project ("lightweight shared component set implementing the UI/UX Doctrine V1"). Typed with `/ui <description>` in an editor that supports it.

Why it matters here: could speed up turning the Doctrine's component families (Part XII §39.3 — Card, Panel/Dialog, Pill, the black AI badge, status badges, etc.) into real shadcn-based React components, especially for the more fiddly ones (the AI badge, the risk/digest cards, the onboarding step wizard chips). Not essential — a competent frontend dev/agent can hand-translate the Doctrine's tokens directly — but it can cut first-draft component time.

Optional, nice-to-have. Try it on one component (e.g. the AI badge) before deciding whether to lean on it more.

Source: [GitHub](https://github.com/21st-dev/magic-mcp)

## 9. Security Scanning — Semgrep MCP

Maintained by Semgrep. Runs static analysis (5,000+ rules) for security vulnerabilities across most languages, plus custom-rule scanning and AST inspection. Available as local (stdio) or remote (HTTP).

Why it matters here: your entire permission model hinges on RLS policies being airtight — a leaked private note or a misconfigured policy is the single highest-consequence bug this app could ship with. Semgrep won't catch RLS-policy logic errors directly (that's what the Playwright E2E test is for), but it will catch common web-app vulnerability classes (injection, insecure auth patterns, secrets in code) as you write the Node/TypeScript backend and Supabase Auth integration.

Setup now, run it as part of the normal dev loop (and ideally in CI, per your GitHub Actions setup in §7 of the architecture doc).

Source: [GitHub](https://github.com/semgrep/mcp)

## 10. GitHub — GitHub MCP

Anthropic maintains a reference implementation collection (`modelcontextprotocol/servers`) that includes Git/filesystem tools, and GitHub itself publishes an official GitHub MCP server for repo operations (issues, PRs, commits, branches) beyond what local git access gives you.

Why it matters here: you've settled on a single monorepo (§0 decision table). A GitHub MCP is useful once the repo is actually hosted there — for opening/reviewing PRs, checking CI status on GitHub Actions runs, and managing issues, directly from a Claude Code session.

Setup once the repo exists on GitHub. Not blocking before then — local git tools cover everything needed during initial scaffolding.

Source: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

## 11. Google Calendar / Google Forms MCPs

Google now offers an official remote Google Calendar MCP server (list/create/update/delete events, check availability), and community Google Forms MCP servers exist for creating forms, adding questions, and pulling responses. A combined "Google Workspace MCP" (community-maintained, covers Calendar, Forms, Drive, Sheets, Docs, Gmail in one server) is also available.

Why it matters here: two direct hits against your confirmed feature set — the optional Google Calendar sync on the student calendar (AI_Integrations_Spec §2.2), and the Google Forms embed path for the Forms feature (one of the three form-creation options you kept: native / Microsoft Forms / Google Forms). These MCPs are more useful for *building and testing* that integration during development (e.g. verifying OAuth scopes, testing form-response pulls) than for the shipped app itself, which will call the Google APIs directly from your backend.

Setup when you start building the Calendar-sync and Google-Forms-embed features specifically — not needed for the earlier build phases.

Source: [Google Calendar MCP docs](https://developers.google.com/workspace/calendar/api/guides/configure-mcp-server) · [google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp)

## 12. Microsoft Graph / Entra ID — deferred entirely

No MCP needed yet. Your architecture doc explicitly defers Entra ID SSO and OneDrive/Graph API storage to a later milestone (§9, Phase 7), with `users.entra_id` reserved as a nullable field now for exactly this reason. When that milestone comes up, a Microsoft Graph MCP (community servers exist for Graph API access — mail, calendar, OneDrive, Teams) would be worth revisiting, alongside the "short spike on the Entra ID ↔ Supabase Auth migration path" already flagged as an open item.

Defer — revisit at the Phase 7 milestone, not before.

## 13. Claude Code Skills — built-in

Two built-in skills are directly relevant to this build:

**`security-review`** — runs a structured security review pass over code changes. Given how much this app's integrity depends on the RLS/permission boundary (private notes, role-based access), this is worth running on any PR that touches auth, RLS policies, or the `notes`/`ai_action_log` tables specifically — not just as a generic habit.

**`skill-creator`** — lets you build a custom skill later if a repeated, project-specific workflow emerges (e.g. "generate a new AI feature spec section following our established format," or "scaffold a new UC/SU flow screen matching the UI/UX Doctrine's component conventions"). Not needed today, but worth knowing it exists once the build settles into repeatable patterns.

## 14. Custom skill — worth building once code exists

Once the actual Next.js/Supabase codebase exists, it's worth authoring one project-specific skill (via `skill-creator`) that encodes conventions that would otherwise need repeating in every prompt: the AI-badge visual marker rule (now the Doctrine's black marker, §6 of the flow plan records the correction from the original violet spec), the tick-then-confirm status pattern for tasks/requirements, and the private-vs-shared note RLS boundary. This turns tribal knowledge from this conversation into something Claude Code can reference automatically in future sessions, rather than relying on you re-explaining it each time.

Defer until the codebase exists — a skill needs real code/conventions to point at, which is why the Build Runbook authors this at the end of **Stage 2** (Prompt 2.9), not Stage 5: by then all three conventions (Doctrine tokens/AI-badge, tick-then-confirm, RLS boundary) are already real code, so there's no reason to make Stages 3-6 wait longer than necessary for the reinforcement.

## Summary — set up now vs. defer

Now: Supabase MCP, Playwright MCP, Context7 MCP, Semgrep MCP, `security-review` skill. (Note: this section predates the decision to use the Vercel CLI instead of the Vercel MCP — see §4 and the "Updated summary" further down for the current picture.)

When the relevant milestone arrives: GitHub MCP (once repo is hosted), Sentry MCP (once Sentry is wired in), Chrome DevTools MCP (once there's a running app to profile), Google Calendar/Forms MCPs (once those specific features are being built), custom project skill (once the codebase exists).

Optional / evaluate later: Figma MCP (only if designs move into Figma), Magic MCP (trial on one component first).

Deferred with the rest of the Microsoft integration: any Graph/Entra ID MCP, until Phase 7.

---

# Part 2 — Design Taste Skills, More MCPs, and UI Combos

Everything below is a direct follow-up to your question about Emil Kowalski, "impeccable," "taste," "caveman," and "graphify." All five are real — I checked each one against the actual GitHub repos rather than guessing. Important caveat before the details: these are third-party, community-hosted skills (installed via `npx skills add <repo>` into a Claude Code project's `.claude/skills` folder), not part of the Cowork/Claude.ai skill marketplace. I searched that marketplace first and came up empty, which is why — they live on GitHub instead. That means I can't "enable" them in this Cowork session the way I can with `docx` or `pptx`; your dev team would install them once the actual codebase exists and you're working in Claude Code (or Cursor/Windsurf, which support the same skill format).

## 15. Design taste skills (verified real, GitHub-hosted)

**emilkowalski/skills** — by Emil Kowalski, the designer behind Sonner and Vaul (used at Vercel and Linear). Three skills in one repo: `emil-design-eng` (the main one — animation timing/easing rules, e.g. button feedback 100–160ms, dropdowns 150–250ms, modals 200–500ms, plus component design advice), `review-animations` (strict audit of existing animations against his rules), and `animation-vocabulary` (precise vocabulary so you can direct an agent instead of vaguely describing what you want). Install: `npx skills@latest add emilkowalski/skills`.

**pbakaus/impeccable** — by Paul Bakaus (ex-Google, creator of jQuery UI). Installs a 23-command design vocabulary (`polish`, `audit`, `critique`, `distill`, `animate`, `bolder`, `quieter`, etc.) with separate brand-mode and product-mode behavior. Crossed 44k GitHub stars. The pitch: most AI design output looks the same because the model has no vocabulary for direction — this gives it one.

**leonxlnx/taste-skill** — "Anti-Slop Frontend Framework." Stronger defaults for layout, typography, motion, and spacing so agent-built UI doesn't default to generic boilerplate. Currently on an experimental v2. Install: `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend-v1"`.

~~**h3nryprod01/design-taste**~~ — a community merge of the three skills above into one deduplicated skill. **Not in use** — you've chosen to install `emil-design-eng`, `impeccable`, and `taste-skill` individually and skip the merged tie-breaker. Noted here for completeness only.

**Why this matters for Epicenter specifically:** the UI/UX Doctrine V1 already defines a real, binding visual language — the calm/guided tone, the black `.ai-badge` pill (Doctrine §7.10/§35.7 — the storyboards' original violet spec is superseded), risk/digest cards, the tick-then-confirm pill states, the centered pop-up panels, restrained glassmorphism. The risk when Claude Code turns the Doctrine and `UI Inspiration/` references into real React components is exactly what these skills guard against: wrong easing curves, generic shadows instead of the Doctrine's specific card treatment, animations that don't match the "AI drafts, human confirms" restraint your whole product is built around. A rushed or over-animated AI badge would undercut the calm, low-noise tone the Doctrine is deliberate about.

**Recommendation, updated:** with the merged skill out of the picture, the three (`emil-design-eng`, `impeccable`, `taste-skill`) are all installed individually. If they ever give conflicting guidance on the same component, default to `emil-design-eng` — the other two partly draw from the same lineage, and it's the most directly-sourced of the three.

Sources: [emilkowalski/skills](https://github.com/emilkowalski/skills) · [pbakaus/impeccable](https://www.claudepluginhub.com/plugins/pbakaus-impeccable) · [Leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill)

## 16. Caveman — real, but not a design or thinking tool

`JuliusBrussee/caveman` is real: a Claude Code skill that makes the agent respond in terse fragments — "why use many token when few token do trick" — cutting output tokens by roughly 65% on average, while explicitly leaving code, commands, and error output untouched. Toggle with `/caveman`, revert with "normal mode."

Honest evaluation: this is an output-verbosity tool, not a project-thinking or design tool. It won't help Claude reason through the architecture better — it just makes chat replies shorter. Given your own stated preference for concise responses, it's thematically fitting, but I'd treat it as a personal-workflow choice for your own Claude Code sessions rather than something that improves this build. Not adding it to the "set up now" list below — it doesn't touch the project itself.

Source: [GitHub](https://github.com/JuliusBrussee/caveman)

## 17. Graphify — real, and genuinely useful once code exists

`safishamsi/graphify` is real: it turns a folder of code, SQL schemas, scripts, and docs into a queryable knowledge graph (AST-based structural extraction plus semantic modeling), so an agent can ask "what depends on X" or "which modules are central" instead of grepping the whole repo. Reports 6.8x–49x token savings on large-codebase questions; outputs include interactive HTML graphs and GraphRAG-ready JSON.

Why it matters here: your data model has several tightly-coupled pieces once it's built — the RLS policies gating private vs. shared notes, the `StudentContextBundle`/`student_signals`/`AIActionLog` building blocks that multiple AI features share, the roadmap-task-to-application-requirement relationships. As the monorepo grows past the initial scaffold, a tool like this would let Claude Code answer "everything that touches the private-note RLS boundary" in one query instead of re-deriving it from scratch each session.

Setup once the codebase exists (same timing as the custom project skill in §14) — it has nothing to graph before then.

Source: [GitHub](https://github.com/safishamsi/graphify)

## 18. More MCPs — expanding the earlier list

**shadcn MCP** (official, ui.shadcn.com) — browses and installs components directly from the shadcn/ui registry (and any custom registry you configure) into the project. Ties directly to your confirmed "lightweight shared component set implementing the UI/UX Doctrine V1" decision — if that component set ends up built on shadcn primitives (which pairs naturally with the Magic MCP from §8), this is how Claude Code pulls real components in rather than hand-rolling everything. Setup once frontend component work starts.

**Linear MCP** (official, built with Cloudflare + Anthropic, OAuth, 25+ tools) — full read/write access to issues, projects, and workflow states. Useful for turning your architecture doc's 8 build phases into actually tracked issues, and letting Claude Code check "what's left in Phase 3" without you maintaining that separately. Optional — only worth it if you're using Linear (or want to start). Skip if you're tracking phases in the architecture doc itself.

**Notion MCP** (official, hosted server recommended over the local one, which Notion is sunsetting) — read/write access to Notion pages and databases. Only relevant if you migrate the `Product Context/` docs into Notion instead of markdown files; given everything so far has been deliberately kept as version-controlled markdown/HTML in this folder, I'd skip this unless that changes.

**Accessibility — Deque axe MCP (official, paid Axe DevTools subscription) or `priyankark/a11y-mcp` (free, open-source, community)** — both run axe-core accessibility audits (WCAG compliance, color contrast, ARIA validation) against real pages. Your architecture doc's non-functional requirements already flag accessibility as in scope. Given this is a single-pilot build, the free community version is the sensible starting point; only look at Deque's paid tier if accessibility becomes a formal compliance requirement later.

**Resend MCP** (official) — send/manage transactional email via Resend's API. This is newly relevant given your custom email/password auth decision: password reset emails, "welcome to Epicenter" onboarding emails, and any future digest-email experiments would all route through something like this. Not needed for the Supabase Auth flow itself (Supabase can handle basic auth emails out of the box), but worth having if you build anything beyond that — e.g. a weekly counsellor digest email as an alternative to the in-app Daily Triage Digest.

**PostHog MCP** (official) — product analytics, session replay, feature flags, and error tracking in one platform, queryable by an agent (funnels, retention, HogQL). Not in your architecture doc today, but worth flagging: for a pilot with 3 counsellors and ~100 students, knowing which AI features actually get used (vs. built-and-ignored) would directly inform which of the ten AI features are worth carrying past the pilot. Optional — evaluate after the pilot has real usage to measure, not before.

## 19. UI-focused MCP + Skill combinations

Since you asked specifically for combinations rather than single tools — pairing an MCP with a skill or another MCP tends to close the loop that either one leaves open on its own:

**Storyboard → component, with taste enforced:** Magic MCP (§8, generates the first-draft shadcn component from a description) + the `emil-design-eng`/`impeccable`/`taste-skill` trio (reviews/corrects the animation and spacing choices Magic MCP makes) + shadcn MCP (pulls the actual base primitives both are building on). This combo is the most direct path from your storyboard HTML to production-quality React components without hand-authoring every animation curve.

**Design fidelity check, closed loop:** Figma MCP (§7, if you formalize designs there) + Chrome DevTools MCP (§3, screenshots/inspects the actually-rendered page) + Playwright MCP (§2, automates navigating to the page first). Useful for literally comparing "does the built screen match the Figma frame" without you eyeballing it manually.

**Accessibility-in-the-loop:** `a11y-mcp` (§18, runs the audit) + Playwright MCP (§2, navigates to the authenticated student/counsellor views first, since a11y issues can differ by role and by which data is populated) — catches accessibility regressions on the actual authenticated app, not just a logged-out landing page.

**Codebase understanding for a growing monorepo:** Graphify (§17) + Context7 MCP (§6) — Graphify answers "what in *our* code touches this," Context7 answers "what does *the library* actually do here." Together they cover both halves of "why is this breaking" without re-reading the whole repo each time.

**Security-in-depth on the RLS boundary specifically:** Semgrep MCP (§9, catches generic vulnerability patterns) + `security-review` skill (§13, structured review pass) + the Playwright E2E test you've already flagged as the most important one in the app (private-vs-shared note visibility). None of the three alone fully covers this — Semgrep won't understand your specific RLS policy logic, the skill review is a point-in-time pass, and the E2E test only catches what it's specifically written to check.

## 20. More general "think better before building" skills

A few more angles worth having in place before the build starts, beyond design taste specifically:

**`skill-creator`** (already in §13) is also how you'd build a project-specific "Epicenter conventions" skill later — worth restating here since it's the connective tissue between everything in this document and an eventual custom skill.

**`mcp-builder`** (Anthropic-maintained, in your Cowork skill catalog already) — a guide for building a well-designed MCP server, not using one. Only relevant if, down the line, you want to expose Epicenter's own data as an MCP server (e.g. so a counsellor could query their caseload from Claude Desktop directly). Speculative, not part of the pilot scope — flagging for completeness since it showed up in the skills catalog when I searched.

**`canvas-design`** and **`brand-guidelines`** (both in your Cowork skill catalog) — general-purpose visual-asset skills (posters/static art, and Anthropic's own brand system respectively). Not a fit here since Epicenter has its own established, binding visual language in the UI/UX Doctrine V1; mentioning only because they surfaced in the same search, not as a recommendation.

## Updated summary — set up now vs. defer

**Now:** Supabase MCP, Playwright MCP, Context7 MCP, Semgrep MCP, `security-review` skill, shadcn MCP (once component work starts), `a11y-mcp` (free tier). Vercel deployment work goes through the **Vercel CLI**, not an MCP — see §4.

**At the relevant milestone:** GitHub MCP, Sentry MCP, Chrome DevTools MCP, Google Calendar/Forms MCPs, Resend MCP (once auth emails are needed), Graphify (once the codebase exists), custom Epicenter-conventions skill (Build Runbook Stage 2, Prompt 2.9 — as soon as Doctrine tokens, tick-then-confirm, and the RLS boundary are all real code, earlier than Graphify's first meaningful index).

**Optional/evaluate later:** Figma MCP, Magic MCP, Linear MCP, Notion MCP, PostHog MCP (post-pilot usage analysis).

**Not recommended for this project:** `caveman` skill (personal workflow tool, not project-specific — your call for your own sessions), Deque's paid axe MCP (the free community version covers pilot-scale needs).

**Deferred with Microsoft integration:** any Graph/Entra ID MCP, until Phase 7.
