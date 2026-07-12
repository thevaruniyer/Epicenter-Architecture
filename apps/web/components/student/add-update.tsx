"use client";

import { useActionState, useEffect, useState } from "react";
import { Button, Card } from "@epicenter/ui";
import { addStudentUpdate, type UpdateState } from "@/lib/actions/student-notes";

const initial: UpdateState = {};

export function AddUpdate() {
  const [text, setText] = useState("");
  const [state, formAction, pending] = useActionState(addStudentUpdate, initial);

  useEffect(() => {
    if (state.savedId) setText("");
  }, [state.savedId]);

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="update-text" className="text-sm font-semibold text-ink">
          Add an update
        </label>
        <textarea
          id="update-text"
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Share progress or a question with your counsellor…"
          className="w-full resize-y rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-yellow"
        />
        {state.error ? (
          <p role="alert" className="text-sm text-error-ink">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="sm" disabled={pending || !text.trim()} className="w-fit">
          {pending ? "Sharing…" : "Share update"}
        </Button>
      </form>
    </Card>
  );
}
