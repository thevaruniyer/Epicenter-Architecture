"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UpdateState = { error?: string; savedId?: string };

// "Add an Update" (SU5): a student adds a shared note (type student_update). AI
// clean-up is Phase 5 — plain text for now (final_text = raw_text). RLS only lets
// a student insert a shared student_update for themselves.
export async function addStudentUpdate(
  _prev: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Write an update first." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("notes")
    .insert({
      student_id: user.id,
      author_id: user.id,
      visibility: "shared",
      type: "student_update",
      raw_text: text,
      final_text: text,
      ai_cleaned: false,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/student/notes");
  return { savedId: data.id as string };
}
