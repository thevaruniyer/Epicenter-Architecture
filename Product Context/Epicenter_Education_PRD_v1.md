# Epicenter Education — Product Requirements Document (v1)

**Status:** Draft for pilot scoping
**Prepared for:** Principal pitch + engineering scoping
**Scope:** Single-school pilot, College Counselling team

---

## 1. Problem Statement

College counselling teams currently run the entire university application process through spreadsheets, email, and personal notebooks. At the pilot school, this looks like:

- A team of 3 counsellors, each assigned 30–40 students, managing roughly 100 students total (of which ~35–40 are "active" Grade 12 applicants in any given season).
- Student information — subjects, grades, extracurriculars, interests, meeting notes — lives in personal notebooks that are updated inconsistently and are not shared across the team.
- Documents move by email and get re-requested because nothing is centrally tracked.
- Deadlines, shortlist decisions, and task follow-ups exist only in the counsellor's memory or scattered files, so students are often the ones driving their own process forward — digging up their own documents, tracking their own deadlines, chasing their own progress.

The root cause is two compounding failures, not one: **information is scattered across tools and people**, and **the follow-up nudge that should catch a slipping student either never happens or gets forgotten** even when a counsellor intends to send it. High caseloads make manual, memory-based follow-up unreliable at scale, so students receive inconsistent attention regardless of a counsellor's individual effort or care.

Epicenter Education replaces this with one continuously updated workspace shared by a counsellor and their students, so nothing depends on a notebook, an inbox, or a counsellor's memory.

---

## 2. Product Definition (Simplest Form)

Epicenter Education is a shared workspace, one per student, where a counsellor and their assigned student track everything about the university application journey — profile, roadmap, tasks, university shortlist, live applications, and documents — in a single continuously updated place, replacing spreadsheets, email threads, and notebooks.

If it isn't in Epicenter, it didn't happen. That is the standard the product is designed against.

---

## 3. Users

V1 has three active user types. Parents and teachers/recommenders are explicitly deferred (see Non-Goals).

### 3.1 Admin — "Priya Nair," 42, School Registrar
- Creates student profiles at the start of Grade 11 (subjects, base info).
- Acts as the school's data controller — owns decisions about data retention and deletion.
- Configures school-level settings (currently: one school, so this may be founder-managed rather than self-serve in V1).

### 3.2 Counsellor — "Rohan Mehta," 34, College Counsellor
- One of 3 counsellors on the team; assigned 30–40 students, but can view and edit **any** student's profile on the team (flat access across counsellors).
- Builds and assigns roadmaps (from templates), judges reach/target/safety categorization, manually enters grades as reported by students, runs meetings and takes notes live and again afterward.
- Other team members: "Simran Kaur" (29) and "Arjun Verma" (45, informal team lead).

### 3.3 Student — "Ananya Kapoor," 17, Grade 12
- Has one assigned counsellor but works inside a shared workspace.
- Self-serves heavily: uploads documents, edits/suggests shortlist entries, adds notes, promotes shortlist entries to live applications, views full history.
- Uses the product on a laptop (no mobile requirement in V1).
- Peer example entering the pipeline: "Kabir Singh," 16, Grade 11.

### 3.4 Deferred roles (not in V1)
- **Parent** — view-only, opt-in per family, explicitly excluded from private counsellor notes. Phase 2.
- **Teacher/Recommender** — recommendation workflow and confidentiality mechanics are unresolved (see Open Questions); full teacher-facing portal deferred to Phase 2.

---

## 4. Use Cases

1. **Onboarding a Grade 11 student.** Priya creates Ananya's profile at the start of Grade 11 with subjects and base info. Rohan (assigned counsellor) fills in interests, ECs, preferences, and private notes after the discovery meeting.
2. **Assigning a summer roadmap to a full cohort.** Rohan duplicates the standard summer roadmap template and bulk-assigns it to all 35 of his active students at once, rather than building each one individually.
3. **Recording a grade checkpoint.** After Ananya reports her Grade 12 mid-term results verbally, Rohan manually logs them against the mid-term checkpoint; the record is visible in her history alongside prior checkpoints (G11 HYE, G11 Finals, G12 Mid-Terms, G12 HYE, G12 Mocks, G12 Boards).
4. **Building and evolving a shortlist.** Ananya adds a university suggestion to her shortlist; Rohan reviews it, categorizes it as "Target," and later moves it to "Reach" after mock results come in. Only the new state is retained — no diff/reason log.
5. **Promoting a shortlist entry to a live application.** Once Ananya decides to apply, she clicks to convert the shortlist entry into a live application in two clicks; the application record pulls its fields (university, course, deadline, requirements) from the existing shortlist entry rather than requiring re-entry.
6. **Reassigning a caseload.** If Rohan leaves, Arjun reassigns Rohan's 35 students to himself and Simran; each student record shows an "Assigned to" field that updates, while all prior notes, tasks, and history remain fully visible and unaffected.
7. **Document handoff.** Ananya uploads her personal statement draft, linked to the school's OneDrive; Rohan reviews it and leaves feedback directly against the roadmap task tied to that document.
8. **Pilot rollout.** The product is piloted with one counsellor's full caseload at one school before expanding to the rest of the counselling team.

---

## 5. User Stories

### Counsellor (Rohan)
- **Before:** Rohan keeps a notebook of notes per student and a personal spreadsheet of deadlines across 35 students. Before every meeting, he has to reconstruct what was discussed last time and what's overdue by flipping through pages and old emails.
- **After:** Rohan opens Ananya's profile and immediately sees her full history — last meeting notes, current roadmap status, shortlist, and anything overdue — without hunting through separate tools.

### Student (Ananya)
- **Before:** Ananya has to remember to email Rohan for feedback on her essay draft, track her own application deadlines in a personal notes app, and re-explain her preferences every time they meet because nothing carries over cleanly.
- **After:** Ananya updates her own notes and uploads her draft directly to her workspace, sees her assigned tasks and deadlines whenever she wants, and walks into meetings with her counsellor already caught up.

### Admin (Priya)
- **Before:** Priya has no visibility into the counselling team's workload or caseload distribution beyond asking counsellors directly.
- **After:** Priya can create and hand off a student profile once, at the start of Grade 11, and trust that it remains the living record for the next two years without her involvement.

---

## 6. Goals (V1)

- Replace spreadsheets, email, and notebooks with one continuously updated workspace per student for the pilot counselling team.
- Let students self-serve updates (documents, shortlist suggestions, notes) instead of waiting on counsellor-initiated contact.
- Preserve full, visible history so any counsellor on the team can pick up any student's context immediately — including after a caseload reassignment or a long gap (e.g., summer break).
- Make the shortlist-to-application transition nearly frictionless (2 clicks, no re-entry).
- Prove operational value with a single counsellor's caseload (~35–40 active Grade 12 students) at one pilot school before wider rollout.
- Ship a white-label-ready shell (branding, login, icon) even though only one school is live initially.

## 7. Non-Goals (V1)

- Financial aid modeling, visa processing, non-university career counselling.
- Parent-facing access (deferred to Phase 2, opt-in, view-only, no private notes).
- Teacher/recommender portal or a fully specified confidential recommendation workflow (mechanics unresolved — deferred).
- Notifications, reminders, or alerts of any kind.
- In-app messaging or chat.
- SIS or gradebook integration; all grades and profile data are entered manually.
- Data migration tooling — there is no bulk import; every student record is hand-entered by the school.
- Mobile app or mobile-optimized experience — laptop/desktop only.
- Monthly or board-level reporting for school leadership.
- Cross-student intelligence (e.g., flagging that multiple students are targeting the same program).
- A licensed university/course database — all university and course data is entered manually.

---

## 8. Product Requirements (V1)

### 8.1 Student Profile
- Created by Admin at start of Grade 11: subjects, base info.
- Editable by both the assigned counsellor and the student, including historical fields.
- Three-tier note structure: private counsellor notes (counsellor-only), shared meeting notes (counsellor + student), and student notes (student-authored, for counsellor review).
- No notifications when a student adds a note — surfaced only when the counsellor next opens the profile or at the next meeting.
- No export function; if a student leaves the school, the record can be deleted by the Admin (data controller).

### 8.2 Roadmap & Tasks
- Built from a standard template (provided by the product), then customized per student.
- Counsellors can duplicate/bulk-assign the same roadmap to their full caseload (up to ~40 students) in one action.
- Every task has an owner, deadline, status, and instructions; students can mark progress, comment, and upload supporting files.
- Full edit history stays visible on the roadmap itself — no separate versioning UI required, just a persistent visible log.

### 8.3 Academic Tracking
- Grades are manually entered by the counsellor, based on what the student reports.
- Fixed checkpoint structure: Grade 11 HYE, Grade 11 Finals, Grade 12 Mid-Terms, Grade 12 HYE, Grade 12 Mocks, Grade 12 Board Results.
- Reach/target/safety eligibility judgments are made entirely by the counsellor — no automated suggestion in V1.

### 8.4 University & Course Shortlist
- All university/course/deadline/requirement data is manually entered — no external database integration.
- Categorization (reach/target/safety) is counsellor judgment.
- Multiple students may target the same university/course; no cross-student visibility or intelligence is surfaced.
- When a shortlist entry changes, only the current state is stored — no historical diff or "reason for change" log in V1.

### 8.5 Applications
- An application is a distinct object from a shortlist entry.
- A shortlist entry becomes a live application when the student either ticks a conversion action or manually adds one — a 2-click flow that pulls existing fields (university, course, deadline, requirements) from the shortlist entry rather than requiring re-entry.
- Status changes are manual (no automated status updates from external systems in V1).

### 8.6 Counsellor & Caseload Management
- All three counsellors can view and edit all student profiles (flat access — no per-counsellor restriction).
- Each student profile displays an "Assigned to" field for the responsible counsellor; reassigning a caseload updates this field while preserving all existing history, notes, and tasks untouched.
- *(Needs engineering design — see Open Questions #1.)*

### 8.7 Documents
- Documents are linked to the school's Microsoft OneDrive rather than stored natively in-app.
- No format conversion required in V1.
- File size limits to be set by engineering (no specific requirement from the school).

### 8.8 Recommendations
- Full recommendation workflow (student questionnaire, teacher drafting, confidentiality enforcement) is **not fully specified** for V1. Recommend scoping a lightweight status-only tracker for V1 and deferring the teacher-facing portal and confidentiality mechanism to Phase 2 (see Open Questions #3).

### 8.9 Dashboards & Reporting
- Per-student profile views are the primary counsellor workspace.
- A basic cross-student view (e.g., overdue tasks, upcoming deadlines) refreshing daily/nightly is in scope, given it is core to the platform's value proposition during application season.
- No monthly or board-level reporting for school leadership in V1.

### 8.10 Permissions & Privacy
- Counsellors: full access to all student profiles on the team.
- Students: access to their own profile only, including private-counsellor-note visibility rules noted in 8.1.
- Admin: full access, acts as data controller.
- Parents, teachers: no access in V1.
- Data residency: school is based in India — data handling should account for India's Digital Personal Data Protection (DPDP) Act, 2023 (see Risks).

### 8.11 Integrations
- Microsoft 365 / OneDrive for document storage/linking — confirmed requirement.
- No SIS, gradebook, or Google Workspace integration in V1.

### 8.12 Platform
- Desktop/laptop web application only. No native mobile app or mobile-optimized layout required for V1.

### 8.13 Onboarding & Migration
- No data migration tooling. Every student record — including students already mid-journey — is entered manually into the system at onboarding.

### 8.14 White-Labeling
- School-specific UI skin, app icon, login page, and possibly a custom domain.
- Underlying platform and codebase are shared/multi-tenant-ready even though V1 deploys to a single school.

---

## 9. Risks

- **Half the problem may go unsolved in V1.** The problem statement identified two causes — scattered info *and* forgotten nudges. V1 addresses the first but explicitly excludes reminders/notifications, so the "forgotten follow-up" failure mode may persist until Phase 2.
- **Adoption resistance.** Counsellors already have a working (if messy) system; if Epicenter feels like extra data entry rather than a net time save, adoption will stall regardless of the pitch to the Principal.
- **No import path.** Because there is no migration tooling, onboarding any student who is already mid-journey requires full manual re-entry — slow, error-prone, and a likely source of early user frustration.
- **Flat permission model may not scale.** All counsellors seeing all students works at a team of 3 but may need revisiting before rollout to larger schools with bigger counselling teams.
- **Recommendation confidentiality is undefined.** Building the recommendation module before deciding how confidentiality is enforced risks either a rebuild or a trust-breaking mistake (e.g., a student seeing a confidential letter).
- **Data privacy exposure.** Sensitive student data (grades, personal notes, family financial considerations) is being stored with no defined retention/deletion policy beyond "delete the database" — this is a compliance gap under India's DPDP Act that should be closed before handling real student data.
- **OneDrive dependency.** Document workflows depend on the school's existing Microsoft licensing and configuration, which is outside the product's control.
- **Desktop-only may reduce student engagement.** Teenagers are largely mobile-first; requiring a laptop for self-serve updates could suppress the very behavior (frequent, low-friction student updates) the product is counting on.
- **White-label liability is undefined.** Reselling a white-labeled product to multiple schools without clarity on data ownership, support obligations, and liability could create legal exposure as the customer base grows beyond one pilot school.

---

## 10. Current Market Assumptions

- The pilot school already uses Microsoft 365/OneDrive, making it the natural document layer rather than building native file storage.
- Counselling teams are small (here, 3 people managing ~100 students) — the product should prove value at this scale before assuming larger schools need SIS integration or enterprise features.
- Students are digitally capable and willing to self-serve on a laptop-based tool without needing mobile access.
- The buyer (Principal) and the daily user (counsellor) are different people with different priorities — the pitch needs to demonstrate operational value to the Principal while remaining genuinely easier than the status quo for counsellors, or adoption will fail regardless of the sale.
- Value is likely to be judged qualitatively at first (counsellor time saved, team morale, possibly turnover) rather than through a hard quantitative metric, since time savings are not currently measurable.
- No dedicated software vendor appears to be entrenched in this specific niche (school-based college counselling workflow) at the pilot school today — the competition is generic tools (spreadsheets, email, notebooks), not a specialized incumbent.

---

## 11. Open Questions

1. **Caseload reassignment design.** What's the actual data model for "Assigned to" — a simple field, or a history of assignment changes over time? Needs engineering design.
2. **Application object mechanics.** Exactly which fields copy from the shortlist entry into the live application on promotion, and which (if any) must be re-entered or re-confirmed at that point?
3. **Recommendation confidentiality mechanism.** How is the "student can see status but not the final letter" rule technically enforced — a permission flag, a separate object type, or a fully separate workflow? Recommend resolving this before building any part of the recommendation module.
4. **Document limits.** What file size limits and supported formats should be enforced? No requirement from the school — needs an engineering default.
5. **Command-centre scope.** Does V1 need a real cross-student dashboard, or is a per-student-profile-only workflow sufficient for a single counsellor's pilot caseload? This affects both engineering scope and the pitch to the Principal (the "application command centre" was positioned as the platform's biggest value driver).
6. **Data retention/deletion policy.** "Database can be deleted" when a student leaves — deleted by whom, on what request process, within what timeframe, and is this sufficient under India's DPDP Act?
7. **School-level configuration.** Is this a self-serve admin UI, or founder-managed setup, given only one school is live right now? This affects how much configuration tooling to build before a second school is onboarded.
8. **Versioning consistency.** Shortlist changes store only the new state (no diff), while roadmap edits are described as fully visible history — should this be made consistent across modules, or is the distinction intentional?
9. **White-label scope and liability.** Is a custom domain per school in scope for V1 or later? What support and liability obligations exist toward a school's families once white-labeled and resold? Recommend legal input before a second school signs on.
10. **Notifications roadmap.** Since reminders are explicitly out of V1 but tied to half the original problem statement, what's the sequencing and trigger design for Phase 2 (deadline proximity, inactivity, missed submission)?
11. **Measuring "time saved."** Is there a lightweight way to benchmark counsellor time-in-tool or task-completion speed even informally, so that the qualitative value claim (morale, retention) can eventually be backed by a number?

---

*This document reflects V1 pilot scope only. Sections of the original full Epicenter Education vision (parent access, recommendation portal, notifications, cross-school reporting, SIS integration) are intentionally deferred and tracked as Phase 2+ backlog items above.*
