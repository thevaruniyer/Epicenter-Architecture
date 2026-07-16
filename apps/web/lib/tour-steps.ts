import type { TourStep } from "@/components/shared/product-tour";

// Stage 9 Prompt 9.11: per-role step content for the Prompt 9.10 tour engine.
// One short sentence each — orientation, not documentation.
export const STUDENT_TOUR_STEPS: TourStep[] = [
  {
    target: "todo",
    title: "Your To Do list",
    content: "Tasks and forms that need your attention show up here first.",
  },
  {
    target: "roadmap",
    title: "Roadmap",
    content: "Your milestones and tasks, in order, set by your counsellor.",
  },
  {
    target: "notes",
    title: "Notes",
    content: "Meeting notes your counsellor has chosen to share with you.",
  },
  {
    target: "shortlist",
    title: "College Shortlist",
    content: "Universities you're considering, grouped by reach, target, and safety.",
  },
  {
    target: "application",
    title: "My Application",
    content: "Track requirements and status for every school you apply to.",
  },
  {
    target: "calendar",
    title: "My Calendar",
    content: "Upcoming meetings with your counsellor.",
  },
  {
    target: "profile",
    title: "My Profile",
    content: "Your grade, subjects, and the details your counsellor sees.",
  },
  {
    target: "notifications",
    title: "Notifications",
    content: "New tasks, meetings, and updates land here.",
  },
];

export const COUNSELLOR_TOUR_STEPS: TourStep[] = [
  {
    target: "dashboard-overview",
    title: "Dashboard",
    content:
      "Your daily digest, students needing attention, and today's schedule, all in one place.",
  },
  {
    target: "students",
    title: "Students",
    content: "Every student on your roster, with quick access to their profile.",
  },
  {
    target: "applications",
    title: "Applications Centre",
    content: "Track every application's requirements and status across your caseload.",
  },
  {
    target: "notes",
    title: "Internal Notes",
    content: "Meeting notes, shared or private, across all your students.",
  },
  {
    target: "reports",
    title: "Reports",
    content: "Progress and outcomes across your caseload.",
  },
  {
    target: "forms",
    title: "Forms",
    content: "Create and assign forms to your students.",
  },
  {
    target: "calendar",
    title: "My Calendar",
    content: "Your scheduled meetings, month by month.",
  },
  {
    target: "notifications",
    title: "Notifications",
    content: "Reassignments, meeting confirmations, and other updates land here.",
  },
];
