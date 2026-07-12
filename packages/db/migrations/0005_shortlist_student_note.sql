-- Per-entry "Why I'm interested" note a student attaches when suggesting a
-- university (student storyboard SU4 Screen 2/3: "Why I'm interested" → shown
-- back as "Your note: …"). The v1 schema/architecture doc omitted this field;
-- the storyboard is the source of truth for fields, so we add it here.
-- Nullable; only populated on student-suggested (or counsellor-entered) rows.

alter table public.shortlist_entries
  add column if not exists student_note text;
