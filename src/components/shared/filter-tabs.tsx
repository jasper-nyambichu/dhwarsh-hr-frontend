import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Segmented filter row above a list.
 *
 * Links, not buttons: the active filter belongs in the URL so a filtered list
 * is shareable, survives a refresh, and the back button steps through filter
 * changes. The page reads the same value from `searchParams`.
 */

export type FilterTab = {
  label: string;
  /** Value written to the query param. `undefined` clears it (the "All" tab). */
  value?: string;
  count?: number;
};

export function FilterTabs({
  tabs,
  active,
  param = "filter",
  basePath,
  preserve,
  className,
}: {
  tabs: readonly FilterTab[];
  /** Currently selected value, from searchParams. */
  active?: string;
  param?: string;
  /** Route the tabs link to, e.g. "/admin/branches". */
  basePath: string;
  /**
   * Other query params to carry across a tab switch, e.g. `{ branchId: "3", date }`.
   * Without this a tab is a link to a fresh query string, so switching tabs on a
   * filtered list silently resets every other filter. Keys that collide with
   * `param` are ignored — the tab owns its own.
   */
  preserve?: Record<string, string | undefined>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tabs.map((tab) => {
        const selected = tab.value === active;

        const params = new URLSearchParams();
        if (tab.value) params.set(param, tab.value);
        for (const [key, value] of Object.entries(preserve ?? {})) {
          if (value && key !== param) params.set(key, value);
        }

        const query = params.toString();
        const href = query ? `${basePath}?${query}` : basePath;

        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={selected ? "true" : undefined}
            className={cn(
              "rounded-md px-4 py-1.5 font-body-md text-body-md transition-colors",
              selected
                ? "border border-surface-container-high bg-surface-container-low font-semibold text-primary"
                : "bg-transparent text-on-surface-variant hover:bg-surface-container-low",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className="ml-1.5 tabular-nums opacity-60">{tab.count}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
