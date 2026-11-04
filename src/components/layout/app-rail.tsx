"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { logout } from "@/app/actions/auth";
import { isNavItemActive, navigationFor } from "@/config/navigation";
import { ROLE_LABEL, type Role } from "@/config/roles";
import { siteConfig } from "@/config/site";
import { Icon } from "@/components/ui/icon";
import { useNav } from "@/components/layout/nav-context";
import { BrandMark } from "@/components/shared/brand-logo";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * The navigation rail.
 *
 * Two widths on desktop: a 96px icon rail and a 264px labelled sidebar. The
 * expanded state pushes the content column (the rail is in normal flow from
 * `md` up, so widening it reflows the page rather than covering it) — the
 * layout's own `min-w-0` is what lets the content actually shrink instead of
 * overflowing.
 *
 * Below `md` the rail is off-canvas and always renders in its labelled form:
 * a drawer has room for text, and an icon-only drawer would be strictly worse
 * than the thing it replaces.
 *
 * Role-scoped: renders only the routes belonging to `role`, so the rail can
 * never surface a link outside that role's namespace. Menu visibility only —
 * the DAL re-checks on every page.
 *
 * The item list scrolls independently of the header and footer, because
 * SUPER_ADMIN owns eight routes and the rail must not push its own footer
 * off-screen on a short viewport.
 */
export function AppRail({ role }: { role: Role }) {
  const pathname = usePathname();
  const { open, close, expanded, toggleExpanded } = useNav();
  const items = navigationFor(role);

  // Close the drawer when the route changes. Without this it stays open over
  // the page the user just navigated to.
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Labels show in the drawer regardless of the desktop width preference.
  const showLabels = expanded;

  return (
    <>
      {/* Scrim. Mobile only — the rail is in flow from md up. */}
      <div
        aria-hidden
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-navy/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <nav
        aria-label="Main navigation"
        className={cn(
          "sidebar-gradient fixed left-0 top-0 z-50 flex h-dvh w-[264px] shrink-0 flex-col py-6 shadow-lg",
          "transition-[transform,width] duration-300 ease-out motion-reduce:transition-none",
          "md:relative md:h-full md:translate-x-0",
          showLabels ? "md:w-[264px]" : "md:w-rail-width",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand + desktop width toggle */}
        <div
          className={cn(
            "mb-6 flex shrink-0 items-center gap-3 px-4",
            showLabels ? "justify-between" : "md:flex-col md:justify-center md:gap-2 md:px-2",
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex min-w-0 items-center gap-3",
              showLabels ? "" : "md:flex-col md:gap-1 md:text-center",
            )}
          >
            {/* Emblem only: the rail collapses to 96px, where the lockup's
                wordmark would be unreadable. The adjacent text names the
                brand, so the mark itself is decorative. */}
            <BrandMark
              eager
              sizes="44px"
              className="size-11 rounded-xl shadow-sm ring-1 ring-white/25"
            />
            <span
              className={cn(
                "flex min-w-0 flex-col",
                showLabels ? "" : "md:items-center",
              )}
            >
              <span
                className={cn(
                  "truncate text-sm font-bold uppercase tracking-wider text-on-primary",
                  showLabels ? "" : "md:font-label-rail md:text-label-rail",
                )}
              >
                {siteConfig.shortName}
              </span>
              <span className="truncate text-[10px] leading-tight text-on-primary/70">
                {ROLE_LABEL[role]}
              </span>
            </span>
          </Link>

          {/* Desktop only. On mobile the drawer is dismissed by the scrim,
              Escape, or picking a route — a second control would just crowd
              the header. */}
          <button
            type="button"
            onClick={toggleExpanded}
            aria-label={showLabels ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={showLabels}
            title={showLabels ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-on-primary/70 transition-colors hover:bg-surface-container-lowest/15 hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/60 md:flex"
          >
            <Icon
              name={showLabels ? "menu_open" : "menu"}
              className="text-[20px]"
            />
          </button>

          {/* Mobile drawer dismiss. */}
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-on-primary/70 transition-colors hover:bg-surface-container-lowest/15 hover:text-on-primary md:hidden"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Routes */}
        <ul className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-3 md:px-2">
          {items.map((item) => {
            const active = isNavItemActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  /* Native tooltip so a collapsed rail is still identifiable
                     without hover-only custom chrome. */
                  title={showLabels ? undefined : item.title}
                  className={cn(
                    "group relative flex items-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/60",
                    // Drawer and expanded rail: icon beside label.
                    "gap-3 px-3 py-2.5",
                    // Collapsed desktop rail: icon above label, centred.
                    showLabels
                      ? ""
                      : "md:flex-col md:justify-center md:gap-1 md:px-2 md:py-2 md:text-center",
                    active
                      ? "bg-surface-container-lowest/20 text-on-primary"
                      : "text-on-primary/70 hover:bg-surface-container-lowest/10 hover:text-on-primary",
                  )}
                >
                  {/* Active marker on the rail edge */}
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-on-primary"
                    />
                  ) : null}

                  <Icon
                    name={item.icon}
                    filled={active}
                    className="shrink-0 text-[22px]"
                  />
                  <span
                    className={cn(
                      "min-w-0 truncate text-sm font-medium leading-tight",
                      // Only the collapsed desktop rail drops to the 10px
                      // two-line label; the drawer has room for real text.
                      showLabels
                        ? ""
                        : "md:whitespace-normal md:font-label-rail md:text-label-rail",
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="mt-auto flex shrink-0 flex-col gap-1 px-3 pt-4 md:px-2">
          {/* Not a Link: there is no /help route yet, and a rail item that
              404s is worse than one that says "not built". */}
          <button
            type="button"
            onClick={() => {
              close();
              toast.notImplemented("Help centre");
            }}
            title={showLabels ? undefined : "Help"}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-on-primary/70 transition-colors hover:bg-surface-container-lowest/10 hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/60",
              showLabels
                ? ""
                : "md:flex-col md:justify-center md:gap-1 md:px-2 md:py-2 md:text-center",
            )}
          >
            <Icon name="help" className="shrink-0 text-[22px]" />
            <span
              className={cn(
                "text-sm font-medium",
                showLabels ? "" : "md:font-label-rail md:text-label-rail",
              )}
            >
              Help
            </span>
          </button>

          {/* Server Action — a real POST, so signing out survives JS being off
              and cannot be triggered by a cross-origin GET. */}
          <form action={logout}>
            <button
              type="submit"
              title={showLabels ? undefined : "Logout"}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-on-primary/70 transition-colors hover:bg-surface-container-lowest/10 hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/60",
                showLabels
                  ? ""
                  : "md:flex-col md:justify-center md:gap-1 md:px-2 md:py-2 md:text-center",
              )}
            >
              <Icon name="logout" className="shrink-0 text-[22px]" />
              <span
                className={cn(
                  "text-sm font-medium",
                  showLabels ? "" : "md:font-label-rail md:text-label-rail",
                )}
              >
                Logout
              </span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
