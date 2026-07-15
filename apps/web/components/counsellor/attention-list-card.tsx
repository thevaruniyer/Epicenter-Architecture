import Link from "next/link";

export type AttentionItem = { id: string; label: string; meta: string; href: string };

const TONE = {
  overdue: {
    card: "border-overdue-border bg-overdue-bg",
    pill: "bg-white/70 text-overdue-ink",
  },
  pending: {
    card: "border-pending-border bg-pending-bg",
    pill: "bg-white/70 text-pending-ink",
  },
  // Stage 8 Prompt 8.3, flagged Doctrine exception: reuses the existing
  // target-* tokens (Doctrine's Target-university blue) for a second,
  // unrelated meaning — "awaiting your review" — rather than inventing a new
  // colour. See the Stage 8 Build Runbook note for the deliberate rationale.
  review: {
    card: "border-target-border bg-target-bg",
    pill: "bg-white/70 text-target-ink",
  },
} as const;

// UI/UX Doctrine §20 Dashboard Doctrine: "WHAT REQUIRES ATTENTION / WHAT IS
// OVERDUE / WHAT AWAITS REVIEW". A small itemized list of real, deep-linking
// records (owner, why, where clicking goes), never a bare count or a
// decorative chart (§20.2 explicitly prohibits vanity metrics). Stage 8
// tints the whole card surface by tone (not just the count pill), so the
// dashboard actually reads as colour, not white cards with a small badge.
export function AttentionListCard({
  title,
  description,
  tone,
  items,
  emptyLabel,
  visibleCount = 6,
}: {
  title: string;
  description: string;
  tone: keyof typeof TONE;
  items: AttentionItem[];
  emptyLabel: string;
  visibleCount?: number;
}) {
  const t = TONE[tone];
  const visible = items.slice(0, visibleCount);
  const overflow = items.length - visible.length;
  // An empty list is good news — keep it on the neutral surface rather than a
  // coloured card that would read as a false alarm.
  const cardTone = items.length > 0 ? t.card : "border-border-soft bg-surface-raised";

  return (
    <div
      role="region"
      aria-label={title}
      className={`rounded-lg border p-5 shadow-glass ${cardTone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="text-xs text-ink-secondary">{description}</p>
        </div>
        <span className={`shrink-0 rounded-pill border border-black/[0.06] px-2.5 py-1 text-sm font-bold ${t.pill}`}>
          {items.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-ink-secondary">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-black/[0.06]">
          {visible.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="-mx-1 flex items-center justify-between gap-3 rounded-md px-1 py-2 text-sm transition-colors hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
              >
                <span className="truncate text-ink">{item.label}</span>
                <span className="shrink-0 text-xs text-ink-secondary">{item.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {overflow > 0 ? (
        <p className="mt-2 text-xs font-medium text-ink-secondary">
          +{overflow} more
        </p>
      ) : null}
    </div>
  );
}
