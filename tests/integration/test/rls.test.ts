import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

// RLS integration tests. Authenticate as the seeded fixture users (see
// packages/db/tests/seed_rls_fixtures.sql) and assert the permission boundaries
// end to end via the real PostgREST API — the same path a misconfigured route
// would use. RLS filters rows (returns []), it does not error.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = "Test-Passw0rd!";

const EMAIL = {
  student1: "rls-student1@epicenter-test.dev",
  student2: "rls-student2@epicenter-test.dev",
  counsellor1: "rls-counsellor1@epicenter-test.dev",
  counsellor2: "rls-counsellor2@epicenter-test.dev",
  head: "rls-head@epicenter-test.dev",
} as const;

const ID = {
  student1: "11111111-1111-1111-1111-111111111111",
  student2: "22222222-2222-2222-2222-222222222222",
  counsellor2: "44444444-4444-4444-4444-444444444444",
} as const;

const SHARED_NOTE = "aaaaaaaa-0000-0000-0000-000000000001";
const PRIVATE_NOTE = "aaaaaaaa-0000-0000-0000-000000000002";

async function signInAs(email: string): Promise<SupabaseClient> {
  const client = createClient(URL!, KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

const configured = Boolean(URL && KEY);
const suite = configured ? describe : describe.skip;
if (!configured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[rls.test] NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY not set — skipping RLS integration tests.",
  );
}

suite("RLS permission boundaries", () => {
  let student1: SupabaseClient;
  let counsellor1: SupabaseClient;
  let head: SupabaseClient;

  beforeAll(async () => {
    student1 = await signInAs(EMAIL.student1);
    counsellor1 = await signInAs(EMAIL.counsellor1);
    head = await signInAs(EMAIL.head);
  });

  describe("a student cannot fetch another student's data", () => {
    it("sees only their own tasks", async () => {
      const { data, error } = await student1.from("tasks").select("id,student_id");
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.every((t) => t.student_id === ID.student1)).toBe(true);
    });

    it("cannot read student2's tasks even when filtering by their id", async () => {
      const { data, error } = await student1
        .from("tasks")
        .select("id")
        .eq("student_id", ID.student2);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("cannot read student2's profile", async () => {
      const { data, error } = await student1
        .from("student_profiles")
        .select("user_id")
        .eq("user_id", ID.student2);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("a student cannot fetch a private note (the #1 boundary)", () => {
    it("does not return the private note even via a direct id query", async () => {
      const { data, error } = await student1
        .from("notes")
        .select("id,visibility,final_text")
        .eq("id", PRIVATE_NOTE);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("returns none of their notes with visibility=private", async () => {
      const { data, error } = await student1.from("notes").select("visibility");
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.some((n) => n.visibility === "private")).toBe(false);
    });

    it("positive control: the student CAN read their own shared note", async () => {
      const { data, error } = await student1
        .from("notes")
        .select("id")
        .eq("id", SHARED_NOTE);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  });

  describe("a counsellor cannot see another counsellor's caseload", () => {
    it("sees only their own caseload rows", async () => {
      const { data, error } = await counsellor1
        .from("counsellor_caseloads")
        .select("counsellor_id,student_id");
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.every((c) => c.counsellor_id !== ID.counsellor2)).toBe(true);
      expect(data!.length).toBeGreaterThan(0); // sees their own
    });

    it("cannot read counsellor2's caseload even when filtering by their id", async () => {
      const { data, error } = await counsellor1
        .from("counsellor_caseloads")
        .select("student_id")
        .eq("counsellor_id", ID.counsellor2);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("positive controls: authorised access works", () => {
    it("the assigned counsellor CAN read the student's private note", async () => {
      const { data, error } = await counsellor1
        .from("notes")
        .select("id,visibility")
        .eq("id", PRIVATE_NOTE);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0]!.visibility).toBe("private");
    });

    it("head of counselling reads across caseloads (both students' profiles)", async () => {
      const { data, error } = await head
        .from("student_profiles")
        .select("user_id");
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      const ids = data!.map((r) => r.user_id);
      expect(ids).toContain(ID.student1);
      expect(ids).toContain(ID.student2);
    });
  });
});
