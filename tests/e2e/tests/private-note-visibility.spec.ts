import { test, expect } from "@playwright/test";
import { loginAsStudent } from "../support/auth";
import { clientFor, CREDS, STUDENT_ID } from "../support/db";

// The single most important test in the app (CLAUDE.md §4, Runbook 3.7):
// a private note authored by a student's counsellor must NEVER reach the
// student — not in the UI, not in any network payload, and not through a
// direct query with the student's own session. This exercises the real
// Postgres RLS boundary end-to-end, not just that the UI hides it.
test("a counsellor's private note never reaches the student — UI, network, or direct query", async ({
  page,
}) => {
  const stamp = Date.now();
  const SHARED = `SHARED note the student should see ${stamp}`;
  const PRIVATE = `PRIVATE-${stamp}-parents-pushing-imperial-do-not-leak`;

  const counsellor = await clientFor(
    CREDS.counsellor.email,
    CREDS.counsellor.password,
  );

  // Look up the counsellor's own user id so author_id is real.
  const { data: me } = await counsellor.auth.getUser();
  const authorId = me.user!.id;

  // Counsellor authors one shared and one private note on the student.
  const { data: created, error: insertErr } = await counsellor
    .from("notes")
    .insert([
      {
        student_id: STUDENT_ID,
        author_id: authorId,
        visibility: "shared",
        type: "meeting",
        final_text: SHARED,
      },
      {
        student_id: STUDENT_ID,
        author_id: authorId,
        visibility: "private",
        type: "meeting",
        final_text: PRIVATE,
      },
    ])
    .select("id, visibility");
  expect(insertErr).toBeNull();
  const privateId = created!.find((n) => n.visibility === "private")!.id;
  const sharedId = created!.find((n) => n.visibility === "shared")!.id;

  try {
    // Sanity: the private note genuinely exists (so a pass isn't a false
    // negative from the note never being created). The counsellor CAN see it.
    const { data: asCounsellor } = await counsellor
      .from("notes")
      .select("id, final_text")
      .eq("id", privateId)
      .single();
    expect(asCounsellor!.final_text).toBe(PRIVATE);

    // Capture every text-bearing network payload the browser receives while
    // it loads the notes page — the SSR document included.
    const bodies: string[] = [];
    page.on("response", async (res) => {
      try {
        const type = res.headers()["content-type"] ?? "";
        if (/text|html|json|javascript/.test(type)) {
          bodies.push(await res.text());
        }
      } catch {
        // Response body may be unavailable (redirect, cached) — ignore.
      }
    });

    await loginAsStudent(page);
    await page.goto("/student/notes");
    await expect(page.getByText(SHARED)).toBeVisible();

    // (1) UI: the private note's text is nowhere on the rendered page.
    await expect(page.getByText(PRIVATE, { exact: false })).toHaveCount(0);
    expect(await page.content()).not.toContain(PRIVATE);

    // (2) Network: the private text never appears in ANY response payload,
    // including the server-rendered HTML document.
    await page.waitForLoadState("networkidle");
    const leaked = bodies.filter((b) => b.includes(PRIVATE));
    expect(
      leaked,
      "private note text must not appear in any network payload",
    ).toHaveLength(0);
    // The shared note, by contrast, DID come down the wire — proves the capture
    // is actually inspecting note content and the assertion above is meaningful.
    expect(bodies.some((b) => b.includes(SHARED))).toBe(true);

    // (3) Direct query with the student's OWN session — the true RLS boundary.
    const student = await clientFor(
      CREDS.student.email,
      CREDS.student.password,
    );

    // Broad read: only the shared note comes back; the private one is absent.
    const { data: visible } = await student
      .from("notes")
      .select("id, visibility, final_text")
      .eq("student_id", STUDENT_ID);
    const ids = (visible ?? []).map((n) => n.id);
    expect(ids).toContain(sharedId);
    expect(ids).not.toContain(privateId);
    expect((visible ?? []).every((n) => n.visibility === "shared")).toBe(true);

    // Targeted fetch of the private note by id — RLS returns nothing, not a 403
    // we could distinguish from empty; either way the row is unreachable.
    const { data: direct } = await student
      .from("notes")
      .select("id, final_text")
      .eq("id", privateId);
    expect(direct ?? []).toHaveLength(0);
  } finally {
    // Clean up both notes so reruns stay deterministic.
    await counsellor.from("notes").delete().in("id", [sharedId, privateId]);
  }
});
