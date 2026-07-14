"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@epicenter/ui";
import type { SearchResult } from "@/lib/actions/search";

// Split out from search-palette.tsx and loaded via next/dynamic (Stage 6.5
// Prompt 6.5.7 — "oversized client bundles" finding): cmdk's JS was
// previously bundled into every page load in both shells via the always-
// mounted trigger button, even though the palette itself opens rarely.
export function SearchCommandContent({
  open,
  onOpenChange,
  query,
  onQueryChange,
  placeholder,
  loading,
  grouped,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  loading: boolean;
  grouped: Record<string, SearchResult[]>;
  onSelect: (href: string) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput value={query} onValueChange={onQueryChange} placeholder={placeholder} />
      <CommandList>
        {query.trim().length < 2 ? (
          <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
        ) : loading ? (
          <CommandEmpty>Searching…</CommandEmpty>
        ) : Object.keys(grouped).length === 0 ? (
          <CommandEmpty>No results for &ldquo;{query}&rdquo;.</CommandEmpty>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => (
                <CommandItem key={item.id} value={item.id} onSelect={() => onSelect(item.href)}>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{item.label}</span>
                    {item.meta ? (
                      <span className="truncate text-xs text-ink-secondary">{item.meta}</span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        )}
      </CommandList>
    </CommandDialog>
  );
}
