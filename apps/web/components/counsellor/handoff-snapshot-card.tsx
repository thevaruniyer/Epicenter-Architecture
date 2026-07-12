import { AiBadge, Card } from "@epicenter/ui";
import type { HandoffSnapshot } from "@/lib/handoff";

// The permanent handoff summary shown on the receiving counsellor's view of a
// reassigned student (§1.7). AI-generated, permanent — stays as long as the
// snapshot exists. Counsellor-internal.
export function HandoffSnapshotCard({
  snapshot,
}: {
  snapshot: HandoffSnapshot | null;
}) {
  if (!snapshot) return null;

  const when = new Date(snapshot.generatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="bg-surface-muted">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-base font-bold text-ink">Handoff summary</h2>
        <AiBadge label="AI-generated" />
        <span className="text-xs text-ink-tertiary">Generated {when}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-ink-secondary">
        {snapshot.content}
      </p>
    </Card>
  );
}
