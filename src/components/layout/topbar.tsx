"use client";

import { usePathname } from "next/navigation";

import { ROLE_LABEL } from "@/config/roles";
import { Icon } from "@/components/ui/icon";
import { useNav } from "@/components/layout/nav-context";
import { initials } from "@/lib/format";
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
  const greeting = pathname.endsWith("/dashboard");
  const label = user.displayName ?? user.username;
  const firstName = label.split(/\s+/)[0];

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full shrink-0 items-center justify-between gap-4 bg-surface-bright/80 px-container-margin backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label="Open navigation"
          className="p-2 text-on-surface-variant md:hidden"
        >
          <Icon name="menu" />
        </button>

        {greeting ? (
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate font-display-greeting text-display-greeting text-primary">
                Hello {firstName}
              </h1>
              {/* Which role the session is acting as. Nine roles share this
                  shell and several users hold more than one account, so the
                  active one is worth stating rather than inferring from the
                  rail. */}
              <span className="shrink-0 rounded-full border border-primary-container/20 bg-blue-soft px-2.5 py-0.5 text-[11px] font-bold text-primary-container">
                {ROLE_LABEL[user.role]}
              </span>
            </div>
            <p className="truncate font-body-md text-body-md text-on-surface-variant">
              Welcome back. Here&rsquo;s your organisation today.
            </p>
          </div>
        ) : (
          <SearchField placeholder={searchPlaceholder} className="w-48 sm:w-64" />
        )}
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {greeting ? (
          <SearchField
            placeholder={searchPlaceholder}
            className="hidden w-64 lg:flex"
          />
        ) : null}

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-full text-on-surface-variant opacity-80 transition-colors hover:bg-surface-container hover:opacity-100"
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
            className="flex size-10 items-center justify-center rounded-full text-on-surface-variant opacity-80 transition-colors hover:bg-surface-container hover:opacity-100"
          >
            <Icon name="mail" />
          </button>
        </div>

        {/* Profile. Initials rather than a photo — `employees.passport_photo_url`
            is not on the session, and the rail already owns sign-out. */}
        <div className="flex items-center gap-3 border-l border-outline-variant/30 pl-4">
          <div className="hidden text-right sm:block">
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              {label}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {ROLE_LABEL[user.role]}
            </p>
          </div>
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary"
          >
            {initials(label)}
          </span>
        </div>
      </div>
    </header>
  );
}

function SearchField({
  placeholder,
  className,
}: {
  placeholder: string;
  className?: string;
}) {
  return (
    <label
      className={`items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 transition-all focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 ${className ?? "flex"}`}
    >
      <Icon name="search" className="text-lg text-outline" />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        placeholder={placeholder}
        className="w-full border-none bg-transparent p-0 font-body-md text-body-md outline-none placeholder:text-outline focus:ring-0"
      />
    </label>
  );
}
