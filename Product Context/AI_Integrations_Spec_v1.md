# Epicenter Education — AI Integrations Spec v1

This document specifies the AI/LLM features requested for Epicenter Education, incorporating the decisions made when this was clarified. It's written so that a build (e.g. Claude Code working from this spec) has enough context to implement these features correctly, including which decisions are final and which are still open. It supersedes nothing in `Epicenter_Education_PRD_v1.md` — it's an addendum layered on top of it, and follows the same "flag anything beyond current PRD scope" discipline used throughout this project.

**Update:** a follow-up pass selected a further 7 features out of the separate brainstorm document (`AI_LLM_Feature_Ideas_Screen_By_Screen.md`) to actually commit to. Those are folded into §1 below (§1.5–§1.11), and the brainstorm document has been retired now that its useful contents live here instead — no need to maintain two documents with overlapping scope.

---

## 1. Counsellor-Facing Features

### 1.1 AI Meeting Note Clean-Up

**What it does:** After a counsellor finishes typing raw meeting notes, an AI pass reformats and structures the note for readability — fixing grammar, organizing scattered points into a clear structure, without changing what was actually said.

**Decided workflow:** Preview-then-approve. The AI clean-up is never saved silently.
1. Counsellor writes/finishes a raw note (shared or private — clean-up applies to both).
2. Counsellor taps "Clean Up with AI."
3. The cleaned version is shown to the counsellor (in place of, or alongside, the raw draft) for review.
4. Counsellor edits if needed, then explicitly saves. Only the approved version becomes the saved note.

**Implementation default (flagged, not explicitly decided):** Keep the original raw draft in an edit/version trail even after clean-up is approved, rather than discarding it. Given these are meeting records about real students, having an audit trail of "what was actually typed vs. what the AI reshaped it into" is a low-cost safety net. Recommend implementing unless you'd rather keep it simpler and store only the final approved text.

**Applies to both roles:** This same feature (and workflow) is requested on the student side too, for a student's own update notes — see §2.5.

### 1.2 Forms — Three Creation Paths

**Decided:** A counsellor building a form can choose one of three paths per form:
1. **Native** — built and hosted entirely in Epicenter Education, responses stored directly in the platform's own database. No external dependency.
2. **Microsoft Forms** — embedded/connected, extending the existing Microsoft 365 integration already approved in the PRD (§8.11).
3. **Google Forms** — connected via the Google Forms API to pull response data into the platform.

**Scope flag — now doubled:** The PRD (§8.11 Integrations) currently commits to Microsoft 365/OneDrive only and explicitly excludes Google Workspace from V1. Adding Google Forms as an official third path means this document now has two separate integrations (Google Calendar from the prior session, and Google Forms here) that go beyond what §8.11 currently states. This is worth a single consolidated conversation about updating §8.11 to reflect Microsoft + Google as dual-supported integrations, rather than treating each one as a one-off exception.

**Practical note on Google Forms specifically:** pulling response data programmatically requires Google OAuth access to the form (the counsellor's Google account needs to own or be an editor on the form) via the Google Forms API. This is a real OAuth/account-linking flow to design, not just an embed — flagged here so it isn't underestimated at build time.

### 1.3 Roadmap Task Categories + AI Nudge

**Decided data source:** The nudge may draw on structured profile fields (major, countries, career interest, EC list, test scores) **and** all notes — shared and private.

**Why private notes are fair game here:** the nudge is counsellor-facing only, surfaced inside the task-creation panel that only the counsellor sees. It never appears anywhere the student can see it. Since private notes are already visible to the counsellor who wrote them (and other authorised counsellors), using their content to power a nudge shown only to that same audience doesn't cross the private/shared visibility line established elsewhere in this product — it's the same information, just synthesized instead of requiring the counsellor to remember it. This should be re-confirmed if the nudge is ever exposed anywhere else.

**Category list (default, not explicitly decided — flag and confirm):**
- Academic
- Extracurriculars & Achievements
- Essays & Applications
- Testing
- Documents / Admin
- Other

**Flow:**
1. Counsellor opens "+ Add Task" and selects a category (e.g. "Extracurriculars & Achievements").
2. Below the category selector, a short AI-generated line appears, grounded in that student's own profile + notes for that category (e.g. "Has mentioned MUN experience in two notes this term — team captain per her profile"). Sourced live at the moment the category is selected, not pre-computed and stale.
3. This is purely a reference aid shown alongside the task title/description fields — it does not pre-fill or auto-write the task itself. The counsellor still writes the task.

### 1.4 Notes as an AI Context Source (RAG recommendation)

You asked directly for a recommendation on how to store and use meeting-note/profile data as context for LLM calls, and whether RAG is the right approach. Here's the recommendation:

**Don't build a RAG/vector-search system for V1.** At this scale — roughly 100 students, a school year's worth of notes each (likely dozens of short entries per student, not thousands) — a single student's entire note history plus profile comfortably fits inside a normal LLM context window. RAG (retrieval-augmented generation via vector search) solves a problem you don't have yet: too much text to fit in context. Building it now would add real infrastructure (a vector database, an embedding pipeline, retrieval-quality tuning) to solve a scale problem that doesn't exist at 3 counsellors and 100 students.

**What to build instead — direct structured context injection:**
- Extend the existing notes data model (already implied by the IA) with a clean, queryable structure per note: `student_id`, `author_id`, `visibility` (shared/private), `type` (meeting note, student update, AI-cleaned version), `raw_text`, `created_at`.
- For any AI feature that needs context about one student (note clean-up, task nudges, meeting-prep briefings, reassignment snapshots), the backend directly assembles: that student's structured profile fields + their full note history (or a recent window of it) + relevant task/roadmap state, and passes it straight into the LLM call's context. No retrieval step needed — it's just "fetch this one student's rows and build a prompt."
- **Always filter by `student_id` at the database query level, not by attempting to instruct the LLM to ignore other students' data.** This is what actually enforces the PRD's "no cross-student intelligence" boundary — the LLM should never receive another student's data in the first place, rather than being trusted to keep it separate on its own.

**One optimization worth building even without RAG — signal extraction at write-time.** Rather than re-scanning a student's entire raw note history every time a counsellor opens the "+ Add Task" panel (which would be slow and call the LLM constantly), run a small extraction step once, when a note is saved: pull out a short list of tagged signals (e.g. `EC: MUN, team captain`, `testing: SAT planned Dec`) with a reference back to the source note. Store these signals alongside the student's profile. The category nudge (§1.3) then reads from this pre-extracted signal list — fast, cheap, and only re-computed when new notes actually come in, instead of on every task creation.

**When RAG actually becomes worth it:** if either of these happen later, revisit this recommendation:
1. Note history genuinely outgrows a usable context window (multi-year records, heavy attachments).
2. The "ask about this student" open-ended chat feature (mentioned in the accompanying ideas document) gets built, where a counsellor might ask a broad question spanning years of history rather than the system needing a fixed, predictable set of fields. At that point, a lightweight per-student vector index (e.g. pgvector inside the existing app database, rather than a separate vector-DB service) makes sense — still always filtered by `student_id` at the query level for the same cross-student-isolation reason above.

**LLM provider:** no constraint was given, so this spec assumes an external LLM API call (e.g. Anthropic's Claude API) for clean-up, nudges, and signal extraction. Flagging one practical follow-up even though it wasn't asked: since this sends real notes about minors to a third-party API, it's worth confirming the vendor's data processing terms and that the school's own consent/privacy posture covers this before going live — not a blocker for building the spec, just something to have lined up before real student data flows through it in production.

### 1.5 Daily Triage Digest (Dashboard)

**What it does:** A short AI-generated paragraph at the top of the counsellor's dashboard, turning real facts — tasks pending the counsellor's own confirmation, deadlines coming up across the caseload, students with no recent activity — into a readable summary, instead of the counsellor manually scanning every student card to piece this together.

**Grounding rule:** every sentence must be a template filled from real queried data (counts, names, dates). The LLM's job here is phrasing, not fact-finding — consistent with the "factual UI text should be templated, not freely generated" principle this whole spec follows.

**Placement:** sits above the existing dashboard cards (Hero / To-Do / Check-ins) as a summary layer — doesn't replace them.

**Default threshold (flagged — confirm or adjust):** "hasn't been touched in a while" = no note, task update, or profile edit in 14+ days.

### 1.6 Risk Flagging

**What it does:** Cross-references a single student's own checkpoint history, task-completion pace, and roadmap progress to surface something like "grades dropped two checkpoints in a row" or "this milestone is 60% overdue." A nudge to look closer, never a verdict — and never shown to the student.

**Scope boundary:** reads only that one student's own historical data, never compares across students — this is what keeps it inside the PRD's exclusion of cross-student intelligence.

**Default thresholds (flagged — confirm or adjust):**
- Grade risk: flagged when the average drops across two consecutive checkpoints.
- Pace risk: flagged when a milestone's actual progress trails its expected pace (time elapsed vs. % complete) by 50% or more.

**Where it shows up:** a small flag/badge on the student's card in the Students grid and on their Overview tab — not a separate report to check.

### 1.7 Reassignment Handoff Snapshot

**What it does:** When a caseload is reassigned (PRD Use Case 6), the incoming counsellor gets an AI-generated one-page summary of each inherited student — synthesized from profile, notes, shortlist, and task history — instead of reading months of raw notes cold on day one.

**Trigger:** generated automatically the moment a reassignment is confirmed, attached to the student record for the new counsellor to open when they're ready — not pushed as an interrupting notification (this product doesn't do push notifications in V1 per the PRD's Non-Goals).

**Content:** profile highlights, shortlist status, open/stalled tasks, and a short synthesis of recent notes — the same data the new counsellor already has permission to see, just pre-read for them.

### 1.8 Stalled-Task Alerts

**What it does:** Surfaces any task that's been sitting in "Pending Review" (the tick-then-confirm state introduced in the prior session) for several days with no counsellor action, rather than relying on the counsellor to remember to check back on it.

**Default threshold (flagged — confirm or adjust):** 3 business days in Pending Review before it's surfaced as stalled.

**Where it shows up:** folded into the Daily Triage Digest (§1.5), and as a visual indicator on the task itself inside the Roadmap tab.

### 1.9 Essay Feedback First Pass

**What it does:** Before a counsellor writes feedback on an essay draft (PRD Use Case 7, Document Handoff), an AI-drafted first pass — clarity, structure, pacing observations — pre-fills the feedback field in the existing Review & Feedback panel. The counsellor edits or rewrites before saving; nothing reaches the student without the counsellor's own pass over it first.

**Scope:** observations only — structure, clarity, pacing. Not a judgment on the essay's content or argument, and never a rewritten version of the essay itself.

### 1.10 Requirement Checklist Extraction

**What it does:** A counsellor pastes a university's application requirements text (e.g. copied from the university's own admissions page) into a field, and AI extracts a structured checklist — essay, transcript, recommendation letter, forms, deadline — to populate that application's requirements list, instead of manually re-typing each item during the highest-volume part of the year.

**Review step:** extracted items are shown for the counsellor to confirm or edit before they're saved as the application's actual requirement list — the same "AI drafts, human confirms" pattern used everywhere else in this spec.

### 1.11 Meeting Prep Briefing

**What it does:** Before a scheduled meeting (from My Calendar), a short AI-generated prep note pulling that student's recent tasks, notes, and upcoming deadlines — so the counsellor walks in already caught up instead of pulling up the full student record cold.

**Trigger (flagged — confirm or adjust):** pull-based, opened on demand from the calendar event itself (e.g. a "Prep Notes" action on the meeting) — not auto-pushed. This matches the PRD's existing Non-Goal excluding notifications/reminders from V1; a briefing the counsellor has to open, rather than one that pushes itself at them, stays consistent with that.

---

## 2. Student-Facing Features

### 2.1 To-Do List Sourced From Roadmap

Not an AI feature — an architecture requirement. The dashboard's To-Do panel should not be a separately maintained list; it's a filtered view (e.g. "next 3 upcoming, not yet complete") of the student's own Roadmap tasks. "View All" navigates directly to the Roadmap tab, scrolled/filtered to show the same set. One source of truth, two presentations.

### 2.2 Student Calendar + Optional Google Calendar Sync

Mirrors the counsellor's "My Calendar" feature (from the prior session) on the student side:
- A native calendar view exists for every student regardless of any external sync.
- When a counsellor schedules a meeting with a student, it appears on that student's native calendar automatically — this doesn't depend on Google Calendar being connected at all.
- Google Calendar sync is optional, per-student, and purely additive: if connected, the student's Google events also show up merged into their Epicenter calendar view (same merged-view pattern already built for the counsellor). If not connected, nothing is lost — meetings still show up natively.

### 2.3 Student Onboarding Questionnaire

**What it does:** Replaces counsellor-driven data entry at the start of the relationship. On first login, a new student is asked a short set of questions directly: age, grade, subjects, hobbies/interests, intended major, and what their extracurricular activities look like. Their answers populate the same profile fields the counsellor would otherwise have typed in after a discovery meeting (PRD Use Case 1).

**Decisions defaulted here (flagged — confirm or correct):**
- **Structure:** built as its own dedicated onboarding flow, separate from the general Forms feature in §1.2. Onboarding benefits from a tailored, welcoming first-run experience and needs to map answers directly into specific profile fields — a generic form builder would work but wasn't built with that mapping in mind. If you'd rather reuse the Forms engine to save build effort, that's a reasonable alternative; flagging the default choice made here.
- **Mandatory vs. skippable:** defaulted to encouraged-but-skippable — a student can complete it in stages and finish later from My Profile, rather than being blocked from the rest of the app until it's done. Reasoning: forcing a multi-question flow before any access risks hurting first-session adoption.
- **Counsellor edit rights afterward:** onboarding pre-fills the profile; the counsellor's existing "Edit Profile" flow (PRD Use Case 1) still works exactly as before and can add to or correct what the student entered. This doesn't replace counsellor judgment — it gives them a head start instead of a blank profile at the first meeting.
- **Free-text answers → structured fields (confirmed):** for open-ended answers like "what does your EC list look like," this is now a confirmed feature — not just a default — using the same AI-extraction pattern from §1.4's signal extraction: parse the student's own words into structured tags (activity, role, duration) for the profile, shown to the student for confirmation before saving rather than silently auto-filled.

**Effect on the counsellor's view:** whatever the student fills in shows up in the counsellor's Overview/Profile tab exactly as if the counsellor had entered it themselves — same fields, same "Profile Completion" indicator moving accordingly.

### 2.4 "Send to Counsellor" Instead of "Send to [Name]"

Copy change: anywhere a screen currently says "Send to Rohan" (or any specific counsellor's name), it should read "Send to Counsellor" instead — this reflects that the underlying relationship is student-to-assigned-counsellor generically, not tied to a specific name in the UI copy itself. This applies across the student-facing storyboard wherever that pattern appears. Not implemented yet in the existing flow documents — noted here for the next pass, per the instruction not to edit other files during this round.

### 2.5 AI Note Clean-Up (Student Side)

Same feature as §1.1, sized to fit what a student's note actually is. A student's "update" note isn't a formal meeting record, so the clean-up should be lighter — tidying grammar and clarity — rather than restructuring it into the kind of formatted meeting-note layout used for counsellor sessions. Same preview-then-approve workflow: the student sees the cleaned version and confirms before it's saved.

---

## 3. Open Items Requiring a Decision Before Build

Carried forward from this clarification round, listed together so nothing gets lost:

1. **§8.11 Integrations conflict, now twofold.** Google Calendar and Google Forms both go beyond the PRD's current Microsoft-only integration commitment. Worth one decision, not two separate ones: update §8.11 to officially include Google Workspace alongside Microsoft 365, or treat both as deferred/optional add-ons.
2. **AI vendor data handling.** No constraint was set on LLM provider, but real student (and minor) data will flow through whichever one is chosen. Confirm the vendor's data processing terms and the school's consent posture before this goes live with real students — informational note, not a blocker to building against this spec.
3. **Task category list** (§1.3) and **onboarding structure/mandatory-ness/extraction-review** (§2.3) were defaulted rather than explicitly decided. Flagged inline above — correct any that don't match your intent.
4. **New feature thresholds defaulted in this update**, all flagged inline where they appear: 14-day inactivity window (§1.5), two-consecutive-checkpoint grade drop and 50% pace-lag (§1.6), and 3-business-day stalled-task window (§1.8). None of these were explicitly specified — confirm or adjust each.
