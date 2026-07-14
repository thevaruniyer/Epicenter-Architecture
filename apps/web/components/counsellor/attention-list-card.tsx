import Link from "next/link";

export type AttentionItem = { id: string; label: string; meta: string; href: string };

const TONE = {
  overdue: {
    card: "border-l-4 border-l-overdue-border",
    pill: "bg-overdue-bg text-overdue-ink",
  },
  pending: {
    card: "border-l-4 border-l-pending-border",
    pill: "bg-pending-bg text-pending-ink",
  },
} as const;

// UI/UX Doctrine §20 Dashboard Doctrine: "WHAT REQUIRES ATTENTION / WHAT IS
// OVERDUE / WHAT AWAITS REVIEW" — a small itemized list of real, deep-linking
// records (owner, why, where clicking goes), never a bare count or a
// decorative chart (§20.2 explicitly prohibits vanity metrics).
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

  return (
    <div
      role="region"
      aria-label={title}
      className={`rounded-lg border border-border-soft bg-surface-raised p-5 shadow-glass ${t.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="text-xs text-ink-tertiary">{description}</p>
        </div>
        <span className={`shrink-0 rounded-pill px-2.5 py-1 text-sm font-bold ${t.pill}`}>
          {items.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-ink-tertiary">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-border-soft">
          {visible.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="-mx-1 flex items-center justify-between gap-3 rounded-md px-1 py-2 text-sm transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
              >
                <span className="truncate text-ink">{item.label}</span>
                <span className="shrink-0 text-xs text-ink-secondary">{item.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {overflow > 0 ? (
        <p className="mt-2 text-xs font-medium text-ink-tertiary">
          +{overflow} more
        </p>
      ) : null}
    </div>
  );
}
