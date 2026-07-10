# Epicenter Education — Final MCP & Skills Setup Guide v1

Every MCP and skill discussed across `MCP_and_Skills_Reference_v1.md`, set up **right now, in one sitting** — per your instruction to install everything apart from the Part C deferred list. Each entry below has three parts: what it does, the exact prerequisite steps (account creation, credentials, whatever real-world setup it needs), the install command, and how to verify it actually worked.

Repo: `https://github.com/thevaruniyer/Epicenter-Architecture.git`

Two items genuinely cannot be completed today no matter what — not a preference, a hard blocker — and are marked as such: shadcn MCP needs a scaffolded Next.js app first (a few minutes of work, included below), and the custom Epicenter-conventions skill needs real code to encode (moved up to the end of Build Runbook Stage 2, Prompt 2.9 — once Doctrine tokens/AI-badge, tick-then-confirm, and the RLS boundary all exist as real code, not deferred all the way to Stage 5).

**#20 and #21 (Google Calendar MCP, Google Forms MCP) are currently on hold, not "set up now."** Real setup hit `SDK auth failed: HTTP 404` — the documented Google Calendar MCP endpoint doesn't register as written. Rather than debug this mid-build, the whole Calendar & Forms feature moved to a tentative, undated addition at the end of the Build Runbook. Their entries below are kept for when this gets revisited, but treat both as **not verified working** until someone actually gets a clean connection.

---

## 0. One-time prerequisites — do this before anything else

**Step 1 — Clone the repo.**
```
git clone https://github.com/thevaruniyer/Epicenter-Architecture.git
cd Epicenter-Architecture
```
Every command in this document assumes you're running it from inside this directory — several of them (the `skills` CLI, `claude mcp add --scope project`) write config files into the repo itself.

**Step 2 — Confirm base tooling is installed.**
- Node.js 18+ (`node -v`) — needed for every `npx`/`pnpm` command below.
- `pnpm` (`npm install -g pnpm`) — the package manager this monorepo uses.
- `uv` (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`) — needed for Semgrep MCP and Graphify.
- The Claude Code CLI itself, already installed and logged in.

**Step 3 — Open the repo in Claude Code.**
```
claude
```
Run every install command and every verification prompt below from this session, in this directory.

---

## MCPs and Skills — install now

### 1. Supabase MCP
**What it does:** database/schema/migration access to your Supabase Postgres project.
**Prerequisite:**
1. Go to supabase.com and sign up/log in (GitHub login is fastest).
2. New Project → name it `epicenter-architecture-dev` (matching your existing naming convention — everything is `epicenter-architecture`, nothing is `epicenter-education`) → set a strong database password and save it somewhere safe (a password manager — not in a plaintext file in the repo) → pick a region → wait ~2 minutes for provisioning.
3. Once created, go to Project Settings → General and copy the **Project ID** (this is your `project_ref`).
**Install:**
```
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<your-project-ref>" --scope project
```
First run opens a browser OAuth flow — log in and grant access to the org containing this project.
**Verify:** ask Claude Code "list all tables in my Supabase project" — it should complete the OAuth flow and return an empty list (no migrations yet, that's expected and correct at this point).

### 2. Playwright MCP
**What it does:** drives a real browser for E2E testing.
**Prerequisite:** none beyond Node. Run `npx playwright install` once to download browser binaries.
**Install:**
```
claude mcp add --transport stdio playwright --scope project -- npx @playwright/mcp@latest
```
**Verify:** ask "use Playwright to take a screenshot of https://example.com" — confirm it launches a browser and returns a result.

### 3. Context7 MCP
**What it does:** pulls current, version-specific library documentation into context.
**Prerequisite:** none for the free tier. Optional: register at context7.com/dashboard for an API key if you expect heavy usage.
**Install:**
```
claude mcp add --transport http context7 https://mcp.context7.com/mcp --scope project
```
If you got a key: add `--header "CONTEXT7_API_KEY: <your-key>"` to the command above.
**Verify:** ask "use context7 to look up the current Next.js App Router routing conventions" and confirm it returns documentation rather than a generic answer.

### 4. ~~Vercel MCP~~ — REMOVED, using Vercel CLI instead
**Decision:** you're using the Vercel CLI directly rather than the Vercel MCP — Claude Code can just shell out to it, no MCP registration needed. If you'd already added the MCP, remove it: `claude mcp remove vercel --scope project`.
**What it does instead:** the Vercel CLI gives Claude Code (via Bash) the same deploy/logs/project-status capability the MCP would have, without an extra registered server.
**Prerequisite:**
1. `npm install -g vercel`
2. `vercel login` (opens a browser to authenticate).
3. From the repo root: `vercel link` → follow the prompts to link this repo to a new or existing Vercel project.
**Verify:** ask Claude Code "run `vercel ls` and tell me the status of the most recent deployment" — it should shell out to the CLI (already authenticated from step 2) and return real output.

**Note on the duplicate entry you saw:** your `claude mcp list` output also showed a separate `plugin:vercel:vercel` entry with "Needs authentication" — that one came from an installed Claude Code plugin, not from the manual `claude mcp add` command, and `claude mcp remove` won't touch it. Inside a `claude` session, run `/plugin`, find the plugin that bundles the Vercel connector, and disable/uninstall it there. If it still lingers after that, check `.claude/settings.json` and any plugin config in the repo for a leftover Vercel reference.

### 5. Semgrep MCP
**What it does:** static security analysis across the codebase.
**Prerequisite:** `uv` installed (Step 2 above).
**Install:**
```
claude mcp add --transport stdio semgrep --scope project -- uvx semgrep-mcp
```
**Verify:** ask "run a Semgrep scan on this repo" — even against the near-empty repo, confirm it runs without error.

### 6. Sequential Thinking MCP
**What it does:** structured, revisable step-by-step reasoning for comparing trade-offs.
**Prerequisite:** none.
**Install:**
```
claude mcp add --transport stdio sequential-thinking --scope project -- npx -y @modelcontextprotocol/server-sequential-thinking
```
Optional: append `--env DISABLE_THOUGHT_LOGGING=true` if you don't want intermediate thinking steps printed.
**Verify:** ask "think step by step about the trade-offs between two approaches to X" and confirm it uses the structured thinking tool rather than a single-pass answer.

### 7. a11y-mcp (accessibility auditing)
**What it does:** axe-core accessibility audits (WCAG 2a/2aa/21a, contrast, ARIA) against a live URL.
**Prerequisite:** none.
**Install:**
```
claude mcp add --transport stdio a11y --scope project -- npx a11y-mcp
```
**Verify:** run `claude mcp list` and confirm `a11y` shows as connected. Full audits need a real running page, which comes in Build Runbook Stage 3.

### 8. Caveman (skill)
**What it does:** compresses Claude Code's chat replies into terse fragments; never touches code/commands/errors.
**Prerequisite:** none, run from repo root.
**Install:**
```
npx skills add JuliusBrussee/caveman
```
If prompted for a target harness, choose Claude Code.
**Verify:** type `/caveman` and confirm replies get terser; say "normal mode" to revert.

### 9. Graphify (skill)
**What it does:** builds a queryable knowledge graph over the codebase.
**Prerequisite:** `uv` installed (Step 2). Run from repo root.
**Install:**
```
npx skills add safishamsi/graphify
```
Optional standalone CLI alongside the skill: `uv tool install graphifyy`.
**Verify:** type `/graphify` inside Claude Code. It'll build a near-empty graph right now since there's barely any code yet — that's expected. Re-run it after each stage of the Build Runbook to keep the graph current.

### 10. emilkowalski/skills (emil-design-eng, review-animations, animation-vocabulary)
**What it does:** animation timing/easing rules, a strict animation-review pass, precise animation vocabulary.
**Prerequisite:** none, run from repo root.
**Install:**
```
npx skills@latest add emilkowalski/skills
```
**Verify:** once real components exist (Build Runbook Stage 1), ask "review the animation timing on this component" and confirm it applies the emil-design-eng rules.

### 11. pbakaus/impeccable (skill)
**What it does:** 23-command design vocabulary (`polish`, `audit`, `critique`, `distill`, `bolder`, `quieter`, etc.).
**Prerequisite:** Node 24+ if using the tailored installer (`npx impeccable install`); Node 18+ is fine for the generic `npx skills add` path.
**Install:**
```
npx impeccable install
```
Then run `/impeccable init` inside the Claude Code session.
**Verify:** once there's UI to review, run `/impeccable audit` and confirm it produces feedback using its specific vocabulary.

### 12. leonxlnx/taste-skill
**What it does:** anti-slop layout/typography/motion defaults.
**Prerequisite:** none.
**Install:**
```
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend-v1"
```
**Verify:** same pattern as #10/#11 — apply it once there's a real component to check.

### 13. ~~h3nryprod01/design-taste~~ — REMOVED, not in use
**Decision:** you're not using the merged design-taste skill. Skills #10 (emil-design-eng suite), #11 (impeccable), and #12 (taste-skill) stay installed individually; there's no tie-breaker skill layered on top. If the three ever give conflicting guidance on something, use judgment or default to #10 (emil-design-eng) as the most directly-sourced one, since it's what the other two partly draw from. If you'd already run the install command for this one: `rm -rf .claude/skills/design-taste` (check the exact folder name under `.claude/skills/` first, since it may differ slightly from the package name).

### 14. `security-review` (built-in skill)
**What it does:** structured security review pass over pending changes.
**Prerequisite/Install:** none — already available in your Claude Code/Cowork skill catalog.
**Verify:** invoke it against any current diff and confirm it runs (it'll have very little to review right now, which is fine).

### 15. `skill-creator` (built-in skill)
**What it does:** builds new custom skills.
**Prerequisite/Install:** none — already available.
**Verify:** no action needed now — this is what you'll use for item #22 below, in Build Runbook Stage 2 (Prompt 2.9).

### 16. Chrome DevTools MCP
**What it does:** console/network/performance inspection on a real running page.
**Prerequisite:** Google Chrome installed locally.
**Install:**
```
claude mcp add --transport stdio chrome-devtools --scope project -- npx chrome-devtools-mcp@latest
```
**Verify:** once a dev server exists (Build Runbook Stage 0/1), ask "open localhost:3000 and check the console for errors."

### 17. Sentry MCP
**What it does:** pulls live error/issue data for debugging.
**Prerequisite:**
1. Go to sentry.io, sign up/log in.
2. Create an organization (or use an existing one) — e.g. "epicenter-architecture", matching your existing project naming.
3. Create a new project inside it, platform: **Next.js**. Note the DSN it gives you — you'll need that later (Build Runbook Stage 0/1) to actually wire Sentry into the app code; the MCP setup below is separate from that.
**Install:**
```
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp --scope project
```
Complete the browser OAuth flow against your Sentry org.
**Verify:** ask "list issues in my Sentry project" — an empty list is correct for now.

### 18. GitHub MCP
**What it does:** issues/PRs/commits access beyond local git.
**Prerequisite:**
1. On GitHub: Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Resource owner: `thevaruniyer`. Repository access: **Only select repositories** → `Epicenter-Architecture`.
3. Permissions: Contents (Read and write), Pull requests (Read and write), Issues (Read and write).
4. Generate, and copy the token immediately — it's shown once.
5. Store it in an environment variable rather than pasting it raw: `export GITHUB_PAT=<paste-here>`.
**Install:**
```
claude mcp add -s project --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer $GITHUB_PAT"
```
**Verify:** ask "show me open pull requests on thevaruniyer/Epicenter-Architecture."

### 19. shadcn MCP — hard prerequisite, do this part first
**What it does:** browses/installs components from the shadcn/ui registry.
**Prerequisite and install — handled inside Build Runbook Stage 0, Prompts 0.2–0.3, not here.** Claude Code itself scaffolds the Next.js app, runs `pnpm dlx shadcn@latest init`, and registers this MCP (`pnpm dlx shadcn@latest mcp init --client claude`) as part of those two prompts — you don't need to run any of these commands manually. This is the one item on this list where "install now" genuinely means "run Build Runbook Stage 0 first," since there's no app to attach it to before that.
**Verify:** once Stage 0 is done, ask "list available shadcn components" and confirm a real component list comes back, not an error about a missing `components.json`.

### 20. Google Calendar MCP
**What it does:** dev-time Calendar API access for building/testing the calendar-sync feature.

**Prerequisite — Google Cloud Console walkthrough, matching the current "Google Auth Platform" UI (Overview / Branding / Audience / Clients / Data Access / Verification Center / Settings — this replaced the old single "OAuth consent screen" page):**

1. Go to console.cloud.google.com, sign in, and confirm you're in your `Epicenter Architecture` project (top-left project switcher — your screenshot shows this is already selected).
2. **Enable the API first.** Left menu → APIs & Services → Library → search "Google Calendar API" → Enable.
3. **Branding.** Left menu → Google Auth Platform → Branding. Set App name to `Epicenter Architecture`, pick a User support email, and a Developer contact email. Save.
4. **Audience.** Google Auth Platform → Audience. Choose **External** (unless the school already has a Google Workspace org you're building against, in which case Internal). While the app is in **Testing** publishing status, scroll to Test users → Add users → add your own Google account(s) here — anyone not added as a test user will be blocked from the consent screen while it's unpublished.
5. **Data Access (this is where scopes live now, not on the consent screen itself).** Google Auth Platform → Data Access → Add or Remove Scopes → search for and check `.../auth/calendar` and `.../auth/calendar.events` → Update → Save.
6. **Clients (this is where you create the actual OAuth client — the "Create OAuth client" button you're already looking at).** Google Auth Platform → Clients → Create Client (or the "Create OAuth client" button on the Overview page) → Application type: **Desktop app** → name it e.g. `epicenter-architecture-dev` → Create. A dialog shows the **Client ID** and **Client Secret** — copy both now (you can also download the JSON), since the secret isn't shown again later.

**Install:**
```
claude mcp add --transport http google-calendar https://calendar-mcp.googleapis.com/mcp --scope project
```
Check the connecting client's documentation for the exact environment variable names it expects for the client ID/secret (these vary by implementation and can change) — set them before first connecting.
**Verify:** ask "list my Google Calendar events for this week" and complete the OAuth consent flow using one of your added test users.

### 21. Google Forms MCP (community `google_workspace_mcp`)
**What it does:** dev-time Forms API access for building/testing the Google-Forms-embed path.

**Prerequisite:** same Google Cloud project (`Epicenter Architecture`) and the same OAuth client from #20 — you don't need a second client. Additional steps on top of #20:
1. APIs & Services → Library → enable **Google Forms API** and **Google Drive API** (Forms API needs Drive API for file access).
2. Google Auth Platform → Data Access → Add or Remove Scopes → also check the Forms scope (`.../auth/forms.body` or `.../auth/forms` depending on read vs. read/write needs) and a Drive scope (`.../auth/drive.file` is the least-privileged option — grants access only to files the app creates, not your whole Drive). Update → Save.
3. If your app is still in Testing publishing status, the same test users from #20 already cover this — no separate test-user list per API.

**Install:**
```
claude mcp add --transport stdio google-workspace --scope project -- uvx workspace-mcp
```
Same client ID/secret env vars as #20 — check `taylorwilsdon/google_workspace_mcp`'s README for the exact current variable names before running this.
**Verify:** ask "list my Google Forms" and complete the OAuth flow.

### 22. Custom Epicenter-conventions skill — cannot be done today, by design
**What it does:** encodes the UI/UX Doctrine's tokens and black AI-badge rule, the tick-then-confirm pattern, and the private/shared-note RLS boundary as a reusable project skill.
**Why it waits:** this needs real code and conventions to point at — there's nothing to encode yet. This happens in Build Runbook **Stage 2, Prompt 2.9** (moved up from an earlier Stage-5 plan, now that all three conventions exist as real committed code by the end of Stage 2 rather than waiting until Stage 5), using `skill-creator` (#15). Nothing to set up now.

---

## Part C — Deferred / Not Selected For This Project

Kept here per your instruction not to silently remove anything. Evaluated, not installed, no setup steps below since none are being actioned.

**23. Figma MCP** — designs live as static HTML storyboards, not Figma. Revisit only if that changes.
**24. Magic MCP (21st.dev)** — same decision as #23.
**25. Linear MCP** — project tracking stays in this folder's markdown docs.
**26. Notion MCP** — same decision as #25.
**27. Resend MCP** — held back until transactional email is actually being built.
**28. PostHog MCP** — revisit post-pilot, once there's real usage data.
**29. Deque's paid axe MCP** — free a11y-mcp (#7) covers pilot-scale needs.
**30. Microsoft Graph / Entra ID MCP** — tied to the Phase 7 milestone, not evaluated before then.
**31. `mcp-builder` skill** — speculative, outside pilot scope.
**32. `canvas-design` / `brand-guidelines` skills** — don't fit Epicenter's already-established visual language.

---

## Common setup gotchas (learned from the actual first run)

- **Don't type the angle brackets.** Placeholders like `<your-project-ref>` mean "replace this whole token," brackets included, with the real value. A leftover `<...>` in a URL is a silent failure — it'll register in `.mcp.json` but never actually connect (this is exactly what happened with Supabase below).
- **Project-scoped servers need an explicit approval step.** `claude mcp add ... --scope project` only writes the config entry — every server shows "⏸ Pending approval" until you run `claude` (start an interactive session) and approve each one when prompted. OAuth flows (Supabase, Context7, GitHub, Sentry, Google) only trigger *after* that approval, not at `add` time. This is a security feature, not a bug — it exists because `.mcp.json` is committed to git and could in principle contain a server added by someone else.
- **If you already ran an `add` command with a bad value**, don't just re-run `add` — it'll refuse with "already exists." Remove it first: `claude mcp remove <name> --scope project`, then re-add with the corrected value.
- **Fixing the Supabase entry specifically, if you hit this:**
  ```
  claude mcp remove supabase --scope project
  claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<paste-your-real-ref-here-no-brackets>" --scope project
  claude
  ```
  Then approve it when prompted, and re-run the verification prompt from #1 above.

---

## Run order — everything in one sitting

1. Prerequisites: clone repo, confirm Node/pnpm/uv/Claude Code installed (§0).
2. Create accounts/resources first, since several installs need them ready: Supabase project (#1), Vercel CLI login + `vercel link` (#4), Sentry org+project (#17), GitHub PAT (#18).
3. Run every `claude mcp add` command that doesn't need Stage 0 first: #1, 2, 3, 5, 6, 7, 16, 17, 18 (4 and 13 are removed — see their entries above; 19 waits for Stage 0; 20/21 are on hold, not part of this run — see the note above).
4. Run every `npx skills add` command: #8, 9, 10, 11, 12 (13 removed).
5. Confirm #14/#15 (built-in, no action) and note #22 waits for Build Runbook Stage 2, Prompt 2.9.
6. **Start a `claude` session and approve every pending server when prompted** — this is the step that was easy to miss the first time through; nothing OAuth-based connects until you do this.
7. Run `claude mcp list` and confirm #1, 2, 3, 5, 6, 7, 16, 17, 18 all show as connected (not pending, not needs-authentication). Run each verification prompt above once to confirm real functionality.
8. Confirm Vercel CLI is authenticated (`vercel whoami`) and the repo is linked (`vercel link` if not already done).
9. Proceed to Build Runbook Stage 0. Prompt 0.3 there is what actually installs shadcn/ui and registers the shadcn MCP (#19) — that's the one item on this whole list that happens inside the Runbook instead of here.
10. Google Calendar MCP (#20) and Google Forms MCP (#21) stay on hold until the Calendar & Forms tentative addition is actually picked up — don't run their install commands as part of this initial sweep.
