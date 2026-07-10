# Epicenter Education — AI Integration Flow Plan v1

This document takes every feature in `AI_Integrations_Spec_v1.md` and maps it onto the actual product: which button triggers it, which screen it appears on, what data it needs going in, what it produces coming out, who has to approve it, and what the backend has to do to make that happen. It's the bridge between "what we decided to build" (the spec doc) and "what actually gets drawn into the flow storyboards" (the next step, once this is approved). Nothing in the flow storyboards changes until this plan is approved.

Four decisions from the last clarification round shape everything below and are treated as fixed:
1. Student onboarding is a **step wizard** — one question per screen, with a progress bar.
2. Essay Feedback First Pass **auto-generates** the moment the Review & Feedback panel opens — no extra click.
3. Risk flags and stalled-task alerts are **manually dismissible** by the counsellor.
4. Every AI-touched piece of content gets a **consistent visual marker**, permanently — not just until it's reviewed.

---

## 1. Design Principles Carried Into Every Flow Below

**The AI marker.** A small badge — sparkle icon + an "AI-assisted"/"AI-generated" label — in the UI/UX Doctrine's minimal black treatment (see §6 below, which records the correction from this plan's original violet proposal to the Doctrine's black marker — factual, not magical, no dedicated accent hue). It appears on anything AI generated, drafted, or extracted, and it stays even after a human approves/edits it — the point is permanent transparency about provenance, not just a "needs your review" flag.

**AI drafts, a human confirms — with one exception.** Every feature below follows the "AI drafts, human confirms" pattern already established (clean-up preview, nudge is just a reference line, essay feedback pre-fills but isn't sent until edited/saved) — except the three passive/read-only features (Daily Triage Digest, Risk Flagging, Stalled-Task Alerts), which don't produce something that gets "saved" at all. Those are surfaced information, not drafts — there's nothing to approve, only to see and act on (or dismiss).

**Grounding rule.** Anywhere an AI output states a fact (a count, a date, a name), that fact must come from a real query, not a generation. Several features below (digest, risk flags, stalled alerts) are flagged as candidates for **zero-LLM template text** — since the underlying content is already a fully-determined sentence once the facts are known, a plain string template can produce it without an LLM call at all. This is called out per-feature as a cheaper implementation option, not a requirement.

**Pull over push.** Consistent with the PRD's Non-Goal excluding notifications/reminders from V1: nothing below interrupts a counsellor or student. AI content sits and waits to be opened (a digest on the dashboard, a prep note on a calendar event) rather than pushing itself at anyone.

**Everything is logged.** Every AI call — feature, student, what went in, what came out, who reviewed it, whether they edited it before saving — writes to a single `AIActionLog`. This isn't a user-facing feature; it's the audit trail that makes it possible to answer "what did the AI actually say about this student" later if ever needed.

---

## 2. Data Inputs Reference

### 2.1 Onboarding Inputs (first login, one per wizard step)

One flag before the list: the Administrator already creates a student's record with **subjects and base info** at the start of Grade 11, per the PRD's existing Use Case 1. So onboarding shouldn't ask "what subjects do you take?" cold, as if nothing is known — it should show what the Administrator already entered and ask the student to **confirm or correct** it. Framed that way instead of a blank question, onboarding stays consistent with the flow already established rather than contradicting it.

| Step | Question | Input type | Pre-filled? |
|---|---|---|---|
| 1 | How old are you? | Number / date-of-birth | No |
| 2 | What grade are you in? | Confirm/edit | Yes — from Administrator's record |
| 3 | What subjects do you take? | Confirm/edit a list | Yes — from Administrator's record |
| 4 | What hobbies or interests do you have? | Free text → AI-extracted tags | No |
| 5 | What's your intended major? | Free text for every student (no preset list) → AI-extracted/normalized | No |
| 6 | What does your EC list look like? | Free text → AI-extracted structured entries (activity / role / duration) | No |

### 2.2 Ongoing App Inputs That Feed AI Features

| Input | Entered where | Feeds |
|---|---|---|
| Raw meeting/update note text | Meeting Notes composer (counsellor + student) | Clean-Up (§4.1), Signal Extraction → Nudges (§4.3) |
| Task category selection | + Add Task panel | Category-Aware Nudge (§4.3) |
| Checkpoint grades | Update Grades panel | Risk Flagging (§4.6) |
| Task status + timestamps | Roadmap tab | Risk Flagging, Stalled-Task Alerts (§4.6, §4.8) |
| Essay/document draft text | Documents tab, upload | Essay Feedback First Pass (§4.9) |
| Pasted requirements text | Applications tab | Requirement Checklist Extraction (§4.10) |
| Reassignment confirmation | Team tab | Reassignment Handoff Snapshot (§4.7) |
| Calendar event + recent activity | My Calendar | Meeting Prep Briefing (§4.11) |
| Onboarding free-text answers | Onboarding wizard | Conversational Extraction (§5) |

---

## 3. Backend Building Blocks (Shared Across Features)

Rather than re-describing data plumbing in every section below, these four shared pieces are defined once and referenced by name:

- **`StudentContextBundle`** — assembled on demand for a single student: structured profile fields + recent notes (shared + private, per §1.3/§1.4 of the spec doc) + task/roadmap state + checkpoint history + shortlist + application status. Always queried filtered by `student_id` — this is what actually enforces "no cross-student intelligence," not an instruction to the model.
- **`student_signals` table** — populated by a small async job that runs whenever a note is saved: extracts short tagged signals (e.g. `EC: MUN, team captain`) with a pointer back to the source note. The category nudge (§4.3) reads from this table directly instead of re-scanning raw notes live.
- **`AIActionLog`** — every AI call, as described in §1.
- **`flag_dismissals` table** — since risk flags and stalled-task alerts are now manually dismissible (decision #3 above): each flag instance (student + type + the specific triggering event, e.g. "checkpoint 4→5 grade drop" or "task X stalled as of Oct 12") can be dismissed once. A **new** triggering event (another checkpoint drop, the same task still stalled at the next re-check) creates a new flag instance rather than reviving the dismissed one — so dismissing something real doesn't require ignoring it forever if it keeps happening.

---

## 4. Feature-by-Feature Flow Specs

### 4.1 AI Meeting Note Clean-Up (Counsellor + Student)

**Button & placement:** a "Clean Up with AI" button inside the Meeting Notes / Add an Update composer, next to the existing Save action.

**Flow:**
1. Counsellor/student finishes typing a raw note.
2. Taps "Clean Up with AI." The composer's text is replaced in-place by the cleaned version, marked with the AI badge, with "Undo" available to instantly revert to what was typed.
3. They can keep editing the cleaned text directly.
4. Saving (the existing Save action, unchanged) commits whatever's currently in the box — cleaned, edited, or reverted.

**Inputs:** the raw note text only — no `StudentContextBundle` needed, this is a single self-contained text transformation.

**Backend:** one synchronous LLM call per click. The original raw text is retained (per the spec doc's flagged recommendation) as a version field on the note record, not shown in the UI but available if ever needed. Logged to `AIActionLog`.

**Edge case:** empty or extremely short notes (e.g. two words) — the button still works but the AI badge line notes "Nothing much to restructure here" rather than inventing structure from almost nothing.

### 4.2 Forms — Three Creation Paths

Not an AI feature by itself (already fully specified as a UI choice in §1.2 of the spec doc — Native / Microsoft Forms / Google Forms, selected via a segmented control at the top of the "+ Create Form" panel). Included here only because two other features touch it:

- **Draft-from-intent** (mentioned in the earlier ideas doc, not yet in the confirmed spec — flagging it as *not yet selected*, so it's not built unless you want to add it back in).
- **Response summarization** — same status, not yet selected.

No new flow work needed here beyond what's already specified, unless you want to pull either of those two back in.

### 4.3 Category-Aware Nudges

**Button & placement:** no separate button — it's automatic. In the "+ Add Task" panel, the moment a category (Academic / Extracurriculars & Achievements / Essays & Applications / Testing / Documents-Admin / Other) is selected, a line appears directly below the category selector, above the Title field.

**Flow:**
1. Counsellor opens + Add Task, selects a category.
2. The nudge line renders instantly (see backend note — this should feel immediate, not like a loading spinner), carrying the AI badge.
3. Counsellor writes the task title/description as normal. The nudge is reference-only; it's never inserted into the task fields automatically.

**Inputs:** `student_signals` filtered to that category, plus the relevant structured profile fields.

**Backend:** this should be a fast table lookup, not a live LLM call — the heavy lifting already happened when notes were saved (see `student_signals` in §3). If no signals exist yet for that category, the line simply doesn't render rather than showing a fabricated or generic nudge — an empty state, not a forced one.

### 4.4 Notes as an AI Context Source

Infrastructure, not a UI flow — this is `StudentContextBundle` and `student_signals` from §3, which every other feature in this document draws from. No separate button or screen.

### 4.5 Daily Triage Digest

**Placement:** a card at the very top of the counsellor's Dashboard, above the existing Hero/To-Do/Check-ins cards.

**Flow:** loads automatically every time the Dashboard is opened. No button, no trigger — it's just there, like the rest of the dashboard.

**Inputs:** aggregated queries across the counsellor's whole caseload: tasks in Pending Review, upcoming deadlines, students inactive 14+ days (default threshold, flagged for confirmation in the spec doc), plus any live (undismissed) risk flags and stalled-task alerts (§4.6, §4.8) folded into the same paragraph.

**Backend:** candidate for the zero-LLM template approach from §1 — the facts are fully determined by the queries above; a template ("You have **{n}** items pending your confirmation, **{n}** deadlines in the next 7 days, and **{n}** students you haven't checked in on in 2+ weeks.") could render this without calling an LLM at all. If a more natural paragraph is wanted instead of a templated sentence, that's a live LLM call at dashboard-load time, still fact-constrained by the same queries.

### 4.6 Risk Flagging

**Placement:** a small badge on the student's card in the Students grid, and a corresponding card on their Overview tab. Also folded into the Daily Triage Digest (§4.5).

**Flow:**
1. Computed automatically — no counsellor action triggers detection.
2. Counsellor sees the badge, opens the student, sees the detail (e.g. "Average dropped from A- to B+ across two checkpoints").
3. Counsellor taps "Seen, no action needed" to dismiss it. It disappears from the badge/digest. A genuinely new triggering event later creates a fresh flag (§3's `flag_dismissals` logic).

**Inputs:** checkpoint history (for grade risk) and milestone progress vs. elapsed time (for pace risk) — both already-stored structured data, no notes needed.

**Backend:** the *detection* is pure rule-based computation (two-consecutive-checkpoint drop; 50%+ pace lag — both flagged defaults from the spec doc) — no LLM required to decide *whether* to flag something. An LLM is only optional for phrasing the flag as a sentence; the underlying trigger logic should never be delegated to a model.

### 4.7 Reassignment Handoff Snapshot

**Placement:** generated the moment a reassignment is confirmed in the Team tab's Reassign panel. Appears as a permanent, revisitable card at the top of the new counsellor's view of that student's Overview tab (not a one-time popup that vanishes) — labeled something like "Handoff Summary from [Previous Counsellor]'s Caseload," dismissible/collapsible but not deleted, so it's still there weeks later if they want to re-check it.

**Inputs:** full `StudentContextBundle` at the moment of reassignment.

**Backend:** one LLM call triggered by the reassignment-confirm action, synthesizing profile + notes + shortlist + tasks into a short prose summary. Stored as its own record (not a note, not overwritable) attached to the student, scoped to the new counsellor.

### 4.8 Stalled-Task Alerts

**Placement:** a visual indicator directly on the task row inside the Roadmap tab (e.g. the existing task dot changes to a distinct "stalled" state), plus folded into the Daily Triage Digest (§4.5).

**Flow:** computed automatically (3 business days in Pending Review, per the spec doc's flagged default). Dismissible the same way as risk flags (§4.6) — "Seen, no action needed" clears it; a task that stalls again later (e.g. after being reopened) creates a new alert instance.

**Inputs/Backend:** pure rule-based, same reasoning as risk flagging — no LLM needed for detection.

### 4.9 Essay Feedback First Pass

**Placement:** the existing Review & Feedback panel (PRD Use Case 7 — Documents tab, opening an essay draft).

**Flow:**
1. Counsellor opens the essay draft to review it.
2. The moment the panel opens, the feedback text field is **already pre-filled** with an AI-drafted first pass (clarity/structure/pacing observations), marked with the AI badge — no separate generate button, per the decision above.
3. Counsellor edits freely (or replaces entirely) before hitting Save Feedback. Nothing reaches the student until they save.

**Inputs:** the essay draft text plus the task/requirement it's attached to (for context on what the essay needs to accomplish).

**Backend:** synchronous LLM call, fired on panel open. To avoid re-generating (and re-billing) every time the same draft is reopened, cache the first-pass output per draft version — reopening the same unreviewed draft shows the same cached draft rather than calling the LLM again; a genuinely new draft version triggers a fresh call.

### 4.10 Requirement Checklist Extraction

**Placement:** inside an application's requirements area (Applications tab), a "Paste Requirements" action opens a text box, with an "Extract Checklist" button below it.

**Flow:**
1. Counsellor pastes the university's requirements text.
2. Taps "Extract Checklist."
3. Extracted items (essay, transcript, recommendation, forms, deadline — each with the AI badge) appear as editable rows.
4. Counsellor reviews, edits/removes/adds rows, then taps "Save Requirements" to commit them as the application's actual requirement list.

**Inputs:** the pasted text only.

**Backend:** synchronous LLM call with structured output (a list of typed items). Nothing is saved to the application record until the explicit Save action in step 4.

### 4.11 Meeting Prep Briefing

**Placement:** on a calendar event's detail view (My Calendar), a "Prep Notes" action.

**Flow:**
1. Counsellor taps a meeting on their calendar.
2. Taps "Prep Notes."
3. A short AI-generated briefing appears (recent tasks, notes, upcoming deadlines for that student), AI-badged.

**Inputs:** `StudentContextBundle`, scoped to a recent window (e.g. last 60 days) rather than full history, since this is meant to be a quick refresher, not a full record read.

**Backend:** synchronous LLM call, cached per meeting so reopening "Prep Notes" for the same upcoming meeting doesn't regenerate every time — only regenerates if something material has changed since it was last generated (e.g. a new note was added).

---

## 5. Student Onboarding — Full Step Wizard Spec

**Entry point:** first login after account creation. Per the earlier spec doc decision, this is encouraged but skippable — a "Skip for now, I'll finish this later" link on every step, and an in-progress banner on the Home dashboard ("Finish setting up your profile — 3 of 6 done") until it's completed, linking back into the wizard at whichever step was left off.

**Mechanics:** one question per screen, a progress bar/step indicator at the top (matching decision #1 above), Back/Next controls, and the same centered-panel visual language already established (or a full-screen variant of it, since this is a first-run experience rather than an in-context action over existing content).

**Step-by-step:**

1. **Age.** Simple numeric/date input. No AI involved.
2. **Grade.** Shown pre-filled from the Administrator's record ("We have you down as Grade 11 — is that right?") with an edit option. No AI involved.
3. **Subjects.** Same pattern — pre-filled list from the Administrator's record, confirm or edit. No AI involved.
4. **Hobbies & interests.** Free-text box ("Tell us a bit about what you're into outside class"). On "Next," an AI extraction pass runs, showing suggested tags as editable chips (e.g. `Photography` `Chess` `Debate`) below the text box for the student to confirm, remove, or add to, before advancing.
5. **Intended major.** Free text for every student — no preset list. On "Next," a lightweight AI pass normalizes/tags it (e.g. "wanna do something with computers and starting a business" → `Computer Science`, `Entrepreneurship`), shown for confirmation before saving, same review pattern as steps 4 and 6.
6. **EC list.** Free-text box ("What does your extracurricular life look like? Clubs, sports, competitions, leadership roles — whatever's relevant"). On "Next," AI extraction parses this into structured entries (activity / role / duration), shown as editable rows for confirmation — same pattern as step 4, more structured because there's more to extract.

**Completion screen:** a short summary of everything captured, with a final "Looks good — take me to my dashboard" action. This is also where the AI badge appears on anything that went through extraction (steps 4 and 6), so the student can see exactly what was AI-parsed vs. what they typed directly (grade/subjects confirmations, age, major pick).

**Effect on the counsellor's side:** identical to the existing Overview/Profile tab behavior already built — whatever the student confirms shows up exactly as if the counsellor had entered it, "Profile Completion" percentage moves accordingly, and the counsellor's existing Edit Profile action still works untouched on top of it.

---

## 6. The AI Visual Marker (Concrete Spec)

**Superseded by the UI/UX Doctrine V1 (9 July 2026), §7.10 and §35.7 — this section's original violet spec is wrong and must not be built.** The Doctrine is now the binding source of truth for the AI marker; this section is kept only to record what changed and why.

- **Color:** no dedicated AI hue. The Doctrine treats AI-assisted content as a black-semantic treatment — `ink-primary` (`#000000`) text/icon on a neutral surface (`surface-muted` `#F5F5F2` or `surface-raised` `#FFFFFF`), the same neutral family used for privacy labels. The old `--ai: #6E62E5` / `--ai-bg: #EFEBFC` periwinkle/violet pair does not exist in the Doctrine's token set and must not be ported into `tailwind.config.ts` or any component.
- **Badge:** a small pill using a minimal sparkle icon and an "AI-assisted" or "AI-generated" label — same visual weight as other status pills, but deliberately factual rather than "magical." No gradient, no neon accent, no promotional styling (Doctrine §7.10 is explicit on this point).
- **Placement convention:** unchanged from the original spec — immediately adjacent to the piece of content it describes: inline next to a cleaned note's timestamp, inside the nudge line itself, at the top of an extracted checklist, next to the pre-filled essay feedback text, on each extracted onboarding chip.
- **Permanence:** unchanged — the badge doesn't disappear once something is approved/saved, it's a permanent provenance marker, not a "pending review" flag. "Pending Review" as a task/application status keeps its own Doctrine semantic treatment (§7.3, muted rose-toned pending tokens) and stays visually distinct from the AI marker so the two are never confused.
- **Reference elsewhere:** see `Product Context/Epicenter_Education_Architecture_v1.md` §0 for the full Doctrine token block, and `CLAUDE.md` §4 non-negotiable rules, which has the same correction recorded against the earlier violet spec.

---

## 7. Decisions (Resolved) and Remaining Notes

**Resolved in the approval round:**
1. Digest/risk-flag/stalled-alert phrasing uses a **live LLM call**, not a zero-LLM template.
2. Intended major is **free text for every student, no preset list**, with AI normalization/tagging on submit — same pattern as hobbies and EC list.
3. Reassignment snapshot permanence and essay-feedback caching-per-draft were both confirmed as specified above.
4. Essay feedback AI badge is **counsellor-side only** — once feedback is saved, the student sees it as their counsellor's feedback, no AI marker.
5. Risk Flagging / Stalled-Task Alerts / Daily Triage Digest are **purely counsellor-internal** — nothing added to the student-facing flows for these.
6. AI-feature screens that modify an already-existing frame (nudge in Add Task, essay-feedback in Review & Feedback, clean-up in meeting notes, reassignment snapshot in the Team flow, prep briefing in Calendar) get **woven directly into their existing UC/SU sections**, rather than appended as separate new sections.
7. The onboarding wizard is **inserted into the existing "SU1 · First Login & Home Dashboard" section**, between the Login and Home Dashboard frames, rather than built as a standalone section.

This document is now the approved basis for the flow storyboards. See `10_Counsellor_Flows_Full_PRD_Chronological_v3.html` and `11_Student_Flows_Full_PRD_Chronological_v3.html` for the actual screens.
