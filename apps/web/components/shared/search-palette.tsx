"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/actions/search";

// Code-split: cmdk (and the rest of the Command UI) only loads once a user
// actually opens search, not as part of every page's initial JS.
const SearchCommandContent = dynamic(
  () => import("./search-command-content").then((m) => m.SearchCommandContent),
  { ssr: false },
);

// Stage 6.5 Prompt 6.5.6: replaces the decorative search icon (s-search-circle
// in the storyboards) on both shells with a real, role-scoped search — the
// search action passed in is the only thing that differs between the
// counsellor and student shell.
export function SearchPalette({
  searchAction,
  placeholder,
  variant = "full",
}: {
  searchAction: (query: string) => Promise<SearchResult[]>;
  placeholder: string;
  /** "icon" matches the storyboard's compact s-search-circle for the student
   * shell's tighter pill-nav; "full" is the counsellor topbar's wider bar. */
  variant?: "full" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const requestId = useRef(0);

  // Cmd/Ctrl+K toggles from anywhere in the shell — a standard command-palette
  // affordance, not a Doctrine requirement, but harmless alongside the click trigger.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++requestId.current;
    const timeout = setTimeout(() => {
      searchAction(query)
        .then((r) => {
          if (id === requestId.current) {
            setResults(r);
            setLoading(false);
          }
        })
        .catch((err) => {
          // Without this, a failed search action left `loading` stuck true
          // forever — "Searching…" with no way out (design-skill review, 6.5.8).
          Sentry.captureException(err, { tags: { feature: "search" } });
          if (id === requestId.current) {
            setResults([]);
            setLoading(false);
          }
        });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, searchAction]);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  function select(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={placeholder}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border-soft bg-surface-raised text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
        >
          <Search className="size-4" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full max-w-sm items-center gap-2 rounded-md border border-border-soft bg-surface-raised px-3 py-2 text-left text-sm text-ink-tertiary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">{placeholder}</span>
          <kbd className="hidden shrink-0 rounded border border-border-soft bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink-tertiary sm:inline">
            ⌘K
          </kbd>
        </button>
      )}

      {open ? (
        <SearchCommandContent
          open={open}
          onOpenChange={setOpen}
          query={query}
          onQueryChange={setQuery}
          placeholder={placeholder}
          loading={loading}
          grouped={grouped}
          onSelect={select}
        />
      ) : null}
    </>
  );
}
