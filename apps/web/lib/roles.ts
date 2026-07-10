// Pure role constants/types — no server-only imports, so this is safe to import
// from Client Components (e.g. the signup role selector). Server-side session
// resolution lives in ./auth.ts.

// The four roles from the PRD permission matrix (architecture §2/§3).
export type UserRole =
  | "admin"
  | "head_of_counselling"
  | "counsellor"
  | "student";

export const USER_ROLES: UserRole[] = [
  "student",
  "counsellor",
  "head_of_counselling",
  "admin",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  counsellor: "Counsellor",
  head_of_counselling: "Head of Counselling",
  admin: "Administrator",
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as string[]).includes(value);
}
