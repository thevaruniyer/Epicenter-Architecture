import { describe, expect, it } from "vitest";
import { isUserRole, ROLE_LABELS, USER_ROLES, type UserRole } from "./roles";

describe("role helpers (RLS/permission logic)", () => {
  it("defines exactly the four PRD roles, no duplicates", () => {
    expect([...USER_ROLES].sort()).toEqual(
      ["admin", "counsellor", "head_of_counselling", "student"].sort(),
    );
    expect(new Set(USER_ROLES).size).toBe(USER_ROLES.length);
  });

  it("has a human label for every role", () => {
    for (const role of USER_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });

  it("isUserRole accepts every valid role", () => {
    for (const role of USER_ROLES) {
      expect(isUserRole(role)).toBe(true);
    }
  });

  it("isUserRole rejects anything else (guards against privilege escalation via bad metadata)", () => {
    const invalid: unknown[] = [
      "superadmin",
      "Admin",
      "",
      "STUDENT",
      undefined,
      null,
      0,
      1,
      {},
      ["admin"],
    ];
    for (const value of invalid) {
      expect(isUserRole(value)).toBe(false);
    }
  });

  it("narrows the type when used as a guard", () => {
    const value: unknown = "counsellor";
    if (isUserRole(value)) {
      const role: UserRole = value;
      expect(role).toBe("counsellor");
    } else {
      throw new Error("expected counsellor to be a valid role");
    }
  });
});
