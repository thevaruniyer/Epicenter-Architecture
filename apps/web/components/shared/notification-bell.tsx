"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { markAllNotificationsRead } from "@/lib/actions/notifications";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  read_at: string | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// Stage 9 Prompt 9.8: the confirmed, sole exception to "all pop-up panels
// center on screen" (CLAUDE.md §4) — a right-edge floating panel, not a
// centered Dialog. Shared between both shells; only the icon-button classes
// passed in by the caller differ (matching each topbar's existing style).
export function NotificationBell({
  initialNotifications,
  iconButtonClassName,
}: {
  initialNotifications: NotificationRow[];
  iconButtonClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleToggle() {
    const opening = !open;
    setOpen(opening);
    if (opening && unreadCount > 0) {
      // Opening marks everything read (not a per-row click) — one consistent
      // action across both shells. Optimistic: the badge clears immediately,
      // the server write happens in the background.
      setNotifications((prev) =>
        prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
      );
      void markAllNotificationsRead();
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        onClick={handleToggle}
        className={`relative ${iconButtonClassName}`}
      >
        <Bell className="size-4" aria-hidden />
        {unreadCount > 0 ? (
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-overdue-ink text-[9px] font-bold leading-none text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          {/* Click-outside-to-close only — deliberately not a dimming
              backdrop, this is a lightweight floating panel, not a modal. */}
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className="animate-in fade-in slide-in-from-top-2 fixed right-4 top-20 z-50 flex max-h-[70vh] w-[360px] flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-glass shadow-glass-float backdrop-blur-glass duration-150 ease-out motion-reduce:animate-none"
          >
            <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
              <h2 className="text-sm font-bold text-ink">Notifications</h2>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-ink-tertiary transition-colors hover:bg-black/5 hover:text-ink"
              >
                ×
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-secondary">
                Nothing yet. You&rsquo;ll see updates here as they happen.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border-soft overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    {n.body ? (
                      <p className="mt-0.5 text-sm text-ink-secondary">{n.body}</p>
                    ) : null}
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-xs text-ink-tertiary">
                        {timeAgo(n.created_at)}
                      </span>
                      {n.cta_href && n.cta_label ? (
                        <Link
                          href={n.cta_href}
                          onClick={() => setOpen(false)}
                          className="text-xs font-semibold text-ink underline decoration-yellow decoration-2 underline-offset-2 hover:text-ink-secondary"
                        >
                          {n.cta_label}
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
