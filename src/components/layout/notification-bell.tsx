"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notification";
import { Icon } from "@/components/ui/icon";
import { formatRelativeTime } from "@/lib/format";
import { NOTIFICATIONS_REFRESH_EVENT } from "@/lib/notification-events";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_TYPE,
  type NotificationResponse,
  type NotificationsPayload,
} from "@/types/notification";

const POLL_MS = 30_000;

/**
 * The bell in the top bar — one component for every role.
 *
 * It lists what still needs attention, i.e. UNREAD notifications only, so
 * "once he approves, the notification vanishes" is just the backend marking it
 * read: the admin's "needs review" notification is cleared when the request is
 * decided, and HR's "approved / rejected" one leaves when they open it.
 *
 * Data comes from `GET /api/notifications` (the browser cannot call the backend
 * directly). It loads on mount, polls every 30s while the tab is visible, and
 * re-fetches immediately on focus, on navigation, and on the
 * `notifications:refresh` event that actions fire after a decision.
 *
 * Marking read is optimistic: the row disappears at once and comes back only if
 * the server refuses.
 */
export function NotificationBell() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsPayload | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });

      if (!response.ok) throw new Error(String(response.status));

      setData((await response.json()) as NotificationsPayload);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // Initial load, and again whenever the route changes (a decision on one page
  // changes what the bell should show on the next).
  useEffect(() => {
    void load();
  }, [load, pathname]);

  // Poll while visible; catch up the moment the tab is shown again.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void load();
    };

    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, tick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, tick);
    };
  }, [load]);

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const items = (data?.items ?? []).filter((item) => !item.read);
  // The server's count is the truth when more than 50 are unread.
  const unread = Math.max(data?.unread ?? 0, items.length);

  async function markRead(item: NotificationResponse) {
    setData((current) =>
      current
        ? {
            items: current.items.map((n) =>
              n.id === item.id ? { ...n, read: true } : n,
            ),
            unread: Math.max(current.unread - 1, 0),
          }
        : current,
    );

    const result = await markNotificationReadAction(item.id);
    if (!result.ok) void load();
  }

  async function markAllRead() {
    setData((current) =>
      current
        ? { items: current.items.map((n) => ({ ...n, read: true })), unread: 0 }
        : current,
    );

    const result = await markAllNotificationsReadAction();
    if (!result.ok) void load();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-live=""
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Icon name="notifications" filled={unread > 0} />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-on-error ring-2 ring-surface-bright"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          data-live-region=""
          className={cn(
            // Phones: a full-width sheet pinned under the 64px header, because an
            // absolutely positioned 384px panel anchored to a bell that sits near
            // the right edge would overflow the left side of a 360px screen.
            "fixed inset-x-3 top-[4.25rem] z-50 flex max-h-[min(32rem,calc(100dvh-5.5rem))] flex-col overflow-hidden rounded-card border border-outline-variant/30 bg-surface-container-lowest shadow-xl",
            // sm and up: a popover under the bell.
            "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96",
          )}
        >
          <header className="flex items-center justify-between gap-3 border-b border-outline-variant/30 px-4 py-3">
            <h2 className="font-body-md text-sm font-semibold text-on-surface">
              Notifications
              {unread > 0 ? (
                <span className="ml-2 rounded-full bg-error-container/40 px-2 py-0.5 text-[10px] font-bold text-error">
                  {unread} new
                </span>
              ) : null}
            </h2>

            {items.length > 0 ? (
              <button
                type="button"
                data-live=""
                onClick={markAllRead}
                className="shrink-0 font-body-md text-[11px] font-semibold text-primary hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </header>

          <div className="no-scrollbar flex-1 overflow-y-auto">
            {data === null && !failed ? (
              <p className="px-4 py-10 text-center font-body-md text-body-md text-outline">
                Loading…
              </p>
            ) : failed && data === null ? (
              <p className="px-4 py-10 text-center font-body-md text-body-md text-on-surface-variant">
                Couldn&apos;t load notifications. Trying again shortly.
              </p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-surface-container">
                  <Icon name="notifications_off" className="text-[22px] text-on-surface-variant" />
                </span>
                <p className="font-body-md text-sm font-semibold text-on-surface">
                  You&apos;re all caught up
                </p>
                <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                  New requests and decisions will show up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/20">
                {items.map((item) => (
                  <li key={item.id}>
                    <NotificationRow
                      item={item}
                      onOpen={() => {
                        void markRead(item);
                        setOpen(false);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- row -- */

const TYPE_STYLE: Record<string, { icon: string; chip: string }> = {
  [NOTIFICATION_TYPE.EMPLOYEE_REQUEST_SUBMITTED]: {
    icon: "how_to_reg",
    chip: "bg-amber-main/15 text-amber-main",
  },
  [NOTIFICATION_TYPE.EMPLOYEE_REQUEST_APPROVED]: {
    icon: "check_circle",
    chip: "bg-tertiary-container/20 text-tertiary",
  },
  [NOTIFICATION_TYPE.EMPLOYEE_REQUEST_REJECTED]: {
    icon: "cancel",
    chip: "bg-error-container/40 text-error",
  },
};

const DEFAULT_STYLE = {
  icon: "notifications",
  chip: "bg-blue-soft text-primary-container",
};

/**
 * Where a notification leads. An admin's "needs review" opens that request.
 * Anything else has no destination and is just dismissed.
 */
function hrefFor(item: NotificationResponse): string | null {
  switch (item.type) {
    case NOTIFICATION_TYPE.EMPLOYEE_REQUEST_SUBMITTED:
      return item.referenceId
        ? `/admin/employee-requests/${item.referenceId}`
        : "/admin/employee-requests";
    default:
      return null;
  }
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationResponse;
  onOpen: () => void;
}) {
  const style = TYPE_STYLE[item.type] ?? DEFAULT_STYLE;
  const href = hrefFor(item);

  const className =
    "flex w-full items-start gap-3 bg-primary-fixed/20 px-4 py-3 text-left transition-colors hover:bg-primary-fixed/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40";

  const body = (
    <>
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          style.chip,
        )}
      >
        <Icon name={style.icon} className="text-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block break-words font-body-md text-body-md text-on-surface">
          {item.message}
        </span>
        <span className="mt-1 block text-[10px] text-outline">
          {formatRelativeTime(item.createdAt)}
        </span>
      </span>

      <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-primary-container" />
    </>
  );

  return href ? (
    <Link href={href} onClick={onOpen} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" data-live="" onClick={onOpen} className={className}>
      {body}
    </button>
  );
}