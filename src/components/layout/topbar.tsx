"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROLE_LABEL, ROLE_NAMESPACE } from "@/config/roles";
import { Icon } from "@/components/ui/icon";
import { useNav } from "@/components/layout/nav-context";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { CurrentUser } from "@/types";

/**
 * Top bar.
 *
 * Client Component because it owns the mobile rail toggle. The user projection
 * it receives comes from the DAL and never contains `accessToken` — see
 * `getCurrentUser()`.
 *
 * Dashboards lead with a greeting; every other page keeps the left side clear
 * (the page's own heading sits right below). There is no search box: it was
 * never wired to anything, so it was removed rather than left as a dead control.
 * The greeting is derived from the route here because a layout cannot see
 * which page it is wrapping.
 */
export function Topbar({ user }: { user: CurrentUser }) {
  const { toggle } = useNav();
  const pathname = usePathname();

  const greeting = pathname.endsWith("/dashboard");
  const label = user.displayName ?? user.username;
  const firstName = label.split(/\s+/)[0];

  return (
    <header className="sticky top-0 z-30 w-full shrink-0 border-b border-outline-variant/20 bg-surface-bright/80 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-6 lg:px-container-margin">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={toggle}
            data-live=""
            aria-label="Open navigation"
            className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
          >
            <Icon name="menu" />
          </button>

          {greeting ? (
            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <h1 className="truncate font-display-greeting text-base text-primary sm:text-display-greeting">
                  Hello {firstName}
                </h1>
                {/* Which role the session is acting as. Nine roles share this
                    shell and several users hold more than one account, so the
                    active one is worth stating rather than inferring from the
                    rail. */}
                <span className="hidden shrink-0 rounded-full border border-primary-container/20 bg-blue-soft px-2.5 py-0.5 text-[11px] font-bold text-primary-container sm:inline">
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
              <p className="hidden truncate font-body-md text-body-md text-on-surface-variant sm:block">
                Welcome back. Here&rsquo;s your organisation today.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-4">
          {/* Self-contained: loads and polls its own unread list. */}
          <NotificationBell />

          <button
            type="button"
            aria-label="Messages"
            className="hidden size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:flex"
          >
            <Icon name="mail" />
          </button>

          {/* Opens their profile. The rail already owns sign-out. */}
          <Link
            href={`${ROLE_NAMESPACE[user.role]}/profile`}
            aria-label="Your profile"
            className="flex items-center gap-3 border-outline-variant/30 sm:border-l sm:pl-4"
          >
            <div className="hidden text-right lg:block">
              <p className="max-w-[16ch] truncate font-body-md text-body-md font-semibold text-on-surface">
                {label}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {ROLE_LABEL[user.role]}
              </p>
            </div>
            <UserAvatar name={label} photoVersion={user.photoVersion} size={36} />
          </Link>
        </div>
      </div>
    </header>
  );
}

