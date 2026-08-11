"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { ROLE_LABEL } from "@/config/roles";
import { Icon } from "@/components/ui/icon";
import { useNav } from "@/components/layout/nav-context";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/types";

/**
 * Top bar.
 *
 * Client Component because it owns the mobile rail toggle. The user projection
 * it receives comes from the DAL and never contains `accessToken` — see
 * `getCurrentUser()`.
 *
 * Stitch ships two variants of this bar: the dashboard leads with a greeting,
 * the list screens lead with a search field. Same bar, so the variant is
 * derived from the route rather than duplicated into two components. It has to
 * be derived here — a layout cannot see which page it is wrapping.
 *
 * Below `sm` the search field collapses to an icon that opens a full-width row
 * underneath. At 360px the bar cannot hold a hamburger, a greeting, a search
 * box and three controls at once, and shrinking the input until it fits makes
 * it useless for a query longer than one word.
 */
export function Topbar({
  user,
  searchPlaceholder = "Search...",
  unreadNotifications = false,
}: {
  user: CurrentUser;
  searchPlaceholder?: string;
  /** Renders the dot on the bell. Wire to `notifications` once the API lands. */
  unreadNotifications?: boolean;
}) {
  const { toggle } = useNav();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

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
          ) : (
            <SearchField
              placeholder={searchPlaceholder}
              className="hidden w-full max-w-xs sm:flex lg:max-w-sm"
            />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-4">
          {greeting ? (
            <SearchField
              placeholder={searchPlaceholder}
              className="hidden w-64 lg:flex"
            />
          ) : null}

          {/* Small screens get the search as a disclosure rather than a
              permanently cramped input. */}
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            data-live=""
            aria-label="Search"
            aria-expanded={searchOpen}
            className={cn(
              "flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              greeting ? "lg:hidden" : "sm:hidden",
            )}
          >
            <Icon name={searchOpen ? "close" : "search"} />
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Icon name="notifications" />
            {unreadNotifications ? (
              <span
                aria-hidden
                className="absolute right-2 top-2 size-2 rounded-full bg-error"
              />
            ) : null}
          </button>

          <button
            type="button"
            aria-label="Messages"
            className="hidden size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:flex"
          >
            <Icon name="mail" />
          </button>

          {/* Profile. Initials rather than a photo — `employees.passport_photo_url`
              is not on the session, and the rail already owns sign-out. */}
          <div className="flex items-center gap-3 border-outline-variant/30 sm:border-l sm:pl-4">
            <div className="hidden text-right lg:block">
              <p className="max-w-[16ch] truncate font-body-md text-body-md font-semibold text-on-surface">
                {label}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {ROLE_LABEL[user.role]}
              </p>
            </div>
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary sm:size-10"
            >
              {initials(label)}
            </span>
          </div>
        </div>
      </div>

      {/* Disclosure row — only rendered at the widths where the inline field
          is hidden, so there is never a second search box on screen. */}
      {searchOpen ? (
        <div
          className={cn(
            "border-t border-outline-variant/20 px-4 py-3 sm:px-6",
            greeting ? "lg:hidden" : "sm:hidden",
          )}
        >
          <SearchField placeholder={searchPlaceholder} autoFocus className="flex w-full" />
        </div>
      ) : null}
    </header>
  );
}

function SearchField({
  placeholder,
  className,
  autoFocus,
}: {
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <label
      className={cn(
        "items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 transition-all focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20",
        className ?? "flex",
      )}
    >
      <Icon name="search" className="shrink-0 text-lg text-outline" />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        placeholder={placeholder}
        // Focus follows the disclosure the user just opened; only ever set
        // when they activated the search toggle themselves.
        autoFocus={autoFocus}
        className="w-full min-w-0 border-none bg-transparent p-0 font-body-md text-body-md outline-none placeholder:text-outline focus:ring-0"
      />
    </label>
  );
}
