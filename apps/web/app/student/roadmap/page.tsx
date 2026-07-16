import Image from "next/image";
import { FileText } from "lucide-react";
import { Card } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import { MarkDoneDialog } from "@/components/student/mark-done-dialog";
import { StudentTaskStatus } from "@/components/student/student-task-status";
import type { TaskStatus } from "@/lib/tick-then-confirm";

type Milestone = { id: string; title: string };
type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  milestone_id: string | null;
  evidence_url: string | null;
  evidence_comment: string | null;
};

const IMAGE_EXT = ["png", "jpg", "jpeg", "webp"];

function formatDue(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function StudentRoadmapPage() {
  const supabase = await createClient();

  const [{ data: milestoneRows }, { data: taskRows }] = await Promise.all([
    supabase.from("roadmap_milestones").select("id, title").order("title"),
    supabase
      .from("tasks")
      .select(
        "id, title, status, due_date, milestone_id, evidence_url, evidence_comment",
      )
      .order("due_date", { nullsFirst: false }),
  ]);

  const milestones = (milestoneRows as Milestone[]) ?? [];
  const tasks = (taskRows as Task[]) ?? [];

  // Signed URLs for evidence thumbnails (private bucket).
  const evidencePaths = tasks
    .map((t) => t.evidence_url)
    .filter((p): p is string => Boolean(p));
  const signedByPath = new Map<string, string>();
  if (evidencePaths.length) {
    const { data: signed } = await supabase.storage
      .from("evidence")
      .createSignedUrls(evidencePaths, 3600);
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
    }
  }

  const groups = [
    ...milestones.map((m) => ({
      key: m.id,
      title: m.title,
      tasks: tasks.filter((t) => t.milestone_id === m.id),
    })),
  ];
  const loose = tasks.filter((t) => t.milestone_id === null);
  if (loose.length) groups.push({ key: "none", title: "Other tasks", tasks: loose });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
          Roadmap
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Your roadmap
        </h1>
      </div>

      {groups.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-secondary">
            Your counsellor hasn&rsquo;t set up your roadmap yet. Check back soon.
          </p>
        </Card>
      ) : (
        groups.map((g) => (
          <Card key={g.key}>
            <h2 className="mb-3 text-base font-bold text-ink">{g.title}</h2>
            {g.tasks.length === 0 ? (
              <p className="text-sm text-ink-tertiary">No tasks yet.</p>
            ) : (
              <ul className="divide-y divide-border-soft">
                {g.tasks.map((t) => {
                  const ext = t.evidence_url?.split(".").pop()?.toLowerCase();
                  const signed = t.evidence_url
                    ? signedByPath.get(t.evidence_url)
                    : undefined;
                  const isImage = ext ? IMAGE_EXT.includes(ext) : false;
                  return (
                    <li key={t.id} id={`task-${t.id}`} className="scroll-mt-4 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink">
                            {t.title}
                          </p>
                          {formatDue(t.due_date) ? (
                            <p className="text-xs text-ink-tertiary">
                              Due {formatDue(t.due_date)}
                            </p>
                          ) : null}
                        </div>
                        <StudentTaskStatus status={t.status} />
                        {t.status !== "complete" ? (
                          <MarkDoneDialog taskId={t.id} taskTitle={t.title} />
                        ) : null}
                      </div>

                      {signed ? (
                        <div className="mt-3 flex items-center gap-3">
                          {isImage ? (
                            <a
                              href={signed}
                              target="_blank"
                              rel="noreferrer"
                              className="block overflow-hidden rounded-md border border-border-soft"
                            >
                              <Image
                                src={signed}
                                alt={`Evidence for ${t.title}`}
                                width={96}
                                height={72}
                                unoptimized
                                className="h-[72px] w-[96px] object-cover"
                              />
                            </a>
                          ) : (
                            <a
                              href={signed}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-md border border-border-soft bg-surface-muted px-3 py-2 text-sm text-ink hover:bg-surface-raised"
                            >
                              <FileText className="size-4" aria-hidden />
                              View evidence
                            </a>
                          )}
                          {t.evidence_comment ? (
                            <p className="text-sm text-ink-secondary">
                              {t.evidence_comment}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
