"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, FileText, Search } from "lucide-react";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@epicenter/ui";

export type DocumentRow = {
  id: string;
  filename: string;
  uploadedAtLabel: string;
  signedUrl: string | null;
  kind: "pdf" | "image" | "other";
};

const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-yellow";

// Documents tab default view (Stage 8, Prompt 8.2). A real chronological,
// searchable list of the student's uploaded documents, with a glassmorphic
// viewer (Dialog primitive already carries the bg-glass/backdrop-blur-glass
// tokens) — no AI action lives on this list, that stays scoped to
// EssayReviewPanel below it.
export function DocumentListCard({ documents }: { documents: DocumentRow[] }) {
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<DocumentRow | null>(null);

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ink">Documents</h2>
        <p className="text-xs text-ink-secondary">
          {documents.length} file{documents.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents…"
          aria-label="Search documents"
          className={fieldClass}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-ink-secondary">
          {documents.length === 0
            ? "No documents uploaded yet."
            : "No documents match your search."}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-border-soft">
          {filtered.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 py-3">
              <FileText className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{doc.filename}</p>
                <p className="text-xs text-ink-tertiary">Uploaded {doc.uploadedAtLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setViewing(doc)}
                  disabled={!doc.signedUrl}
                >
                  Open
                </Button>
                {doc.signedUrl ? (
                  <a
                    href={doc.signedUrl}
                    download={doc.filename}
                    aria-label={`Download ${doc.filename}`}
                    className="grid size-[34px] place-items-center rounded-md border border-border-soft bg-surface-raised text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
                  >
                    <Download className="size-4" aria-hidden />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="w-[min(720px,calc(100vw-2rem))]">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.filename}</DialogTitle>
              </DialogHeader>
              {viewing.kind === "pdf" && viewing.signedUrl ? (
                <iframe
                  src={viewing.signedUrl}
                  title={viewing.filename}
                  className="h-[70vh] w-full rounded-md border border-border-soft bg-white"
                />
              ) : viewing.kind === "image" && viewing.signedUrl ? (
                <div className="relative h-[70vh] w-full overflow-hidden rounded-md border border-border-soft">
                  <Image
                    src={viewing.signedUrl}
                    alt={viewing.filename}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border-strong py-10 text-center">
                  <FileText className="size-6 text-ink-tertiary" aria-hidden />
                  <p className="text-sm text-ink-secondary">
                    Preview isn&rsquo;t available for this file type.
                  </p>
                  {viewing.signedUrl ? (
                    <a
                      href={viewing.signedUrl}
                      download={viewing.filename}
                      className="inline-flex items-center gap-2 rounded-md border border-border-soft bg-surface-muted px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-raised"
                    >
                      <Download className="size-4" aria-hidden />
                      Download to view
                    </a>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
