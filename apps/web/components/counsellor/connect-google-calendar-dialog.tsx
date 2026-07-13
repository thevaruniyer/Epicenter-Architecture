"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from "@epicenter/ui";
import { updateSyncSettings, disconnectGoogleCalendar } from "@/lib/actions/calendar";

// UC9 Screens 2–3: "Connect Google Calendar" then, once connected, exactly
// two independent sync-direction toggles. Not a real working OAuth connection
// until GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI are configured — googleConfigured
// gates a clear message instead of a broken button.
export function ConnectGoogleCalendarDialog({
  open,
  onOpenChange,
  connected,
  showGoogle,
  pushEpicenter,
  googleConfigured,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connected: boolean;
  showGoogle: boolean;
  pushEpicenter: boolean;
  googleConfigured: boolean;
}) {
  const [showGoogleLocal, setShowGoogleLocal] = useState(showGoogle);
  const [pushEpicenterLocal, setPushEpicenterLocal] = useState(pushEpicenter);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {!connected ? (
          <>
            <DialogHeader>
              <DialogTitle>Connect Google Calendar</DialogTitle>
              <DialogDescription>
                See Google Calendar events alongside Epicenter meetings, and
                keep both calendars in sync automatically.
              </DialogDescription>
            </DialogHeader>
            {googleConfigured ? (
              <DialogFooter>
                <Button
                  onClick={() => {
                    window.location.href = "/api/google/calendar/connect";
                  }}
                >
                  Connect Account
                </Button>
              </DialogFooter>
            ) : (
              <p className="text-sm text-ink-secondary">
                Google Calendar isn&rsquo;t connected yet — your administrator
                needs to finish the Google Cloud OAuth setup first.
              </p>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Google Calendar</DialogTitle>
              <DialogDescription>Connected.</DialogDescription>
            </DialogHeader>
            <form action={updateSyncSettings} className="flex flex-col gap-4">
              <input
                type="hidden"
                name="show_google_in_epicenter"
                value={showGoogleLocal ? "true" : "false"}
              />
              <input
                type="hidden"
                name="push_epicenter_to_google"
                value={pushEpicenterLocal ? "true" : "false"}
              />
              <ToggleRow
                label="Show Google events in My Calendar"
                checked={showGoogleLocal}
                onChange={setShowGoogleLocal}
              />
              <ToggleRow
                label="Add new Epicenter meetings to Google Calendar"
                checked={pushEpicenterLocal}
                onChange={setPushEpicenterLocal}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => disconnectGoogleCalendar()}
                >
                  Disconnect
                </Button>
                <Button type="submit" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-pill transition-colors",
          checked ? "bg-yellow" : "bg-surface-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
