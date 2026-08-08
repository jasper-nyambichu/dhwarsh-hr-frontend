"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/actions/auth";
import { isNavItemActive, navigationFor } from "@/config/navigation";
import { ROLE_LABEL, type Role } from "@/config/roles";
import { siteConfig } from "@/config/site";
import { Icon } from "@/components/ui/icon";
import { useNav } from "@/components/layout/nav-context";
import { cn } from "@/lib/utils";

/**
 * The 96px navigation rail.
 *
 * Role-scoped: renders only the routes that belong to `role`, so the rail can
 * never surface a link outside that role's namespace. Menu visibility only —
 * the DAL re-checks on every page.
 *
 * The item list scrolls independently of the header and footer, because
 * SUPER_ADMIN owns nine routes and the rail must not push its own footer
 * off-screen on a short viewport.
 */
export function AppRail({ role }: { role: Role }) {
  const pathname = usePathname();
  const { open, close } = useNav();
  const items = navigationFor(role);

  return (
    <>
      {/* Scrim. Mobile only — the rail is off-canvas below md. */}
      <div
        aria-hidden
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-navy/40 backdrop-blur-[2px] transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <nav
        aria-label="Main navigation"
        className={cn(
          "sidebar-gradient fixed left-0 top-0 z-50 flex h-full w-rail-width shrink-0 flex-col py-6 shadow-lg transition-transform duration-300",
          "md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <Link
          href="/"
          className="mb-8 flex shrink-0 flex-col items-center px-2 text-center"
        >
          <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-surface-container-lowest/20 font-page-title text-page-title text-on-primary">
            {siteConfig.shortName.charAt(0)}
          </span>
          <span className="font-label-rail text-label-rail font-bold uppercase tracking-wider text-on-primary">
            {siteConfig.shortName}
          </span>
          <span className="-mt-0.5 block text-[9px] text-on-primary/70">
            {ROLE_LABEL[role]}
          </span>
        </Link>

        {/* Routes */}
        <ul className="no-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto px-2">
          {items.map((item) => {
            const active = isNavItemActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex scale-95 flex-col items-center justify-center rounded-xl p-2 text-center transition-colors active:scale-90",
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

                  <Icon name={item.icon} filled={active} className="mb-1" />
                  <span className="font-label-rail text-label-rail leading-tight">
                    {item.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="mt-auto flex shrink-0 flex-col gap-2 px-2 pt-4">
          <Link
            href="/help"
            onClick={close}
            className="flex scale-95 flex-col items-center justify-center rounded-xl p-2 text-on-primary/70 transition-colors hover:bg-surface-container-lowest/10 hover:text-on-primary active:scale-90"
          >
            <Icon name="help" className="mb-1" />
            <span className="font-label-rail text-label-rail">Help</span>
          </Link>

          {/* Server Action — a real POST, so signing out survives JS being off
              and cannot be triggered by a cross-origin GET. */}
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full scale-95 flex-col items-center justify-center rounded-xl p-2 text-on-primary/70 transition-colors hover:bg-surface-container-lowest/10 hover:text-on-primary active:scale-90"
            >
              <Icon name="logout" className="mb-1" />
              <span className="font-label-rail text-label-rail">Logout</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
