import Link from "next/link";

import { Icon } from "@/components/ui/icon";

export type QuickAccessItem = {
  href: string;
  title: string;
  icon: string;
  /** A live figure or a short description. */
  hint: string;
  /** Shows a count that needs attention. Leave out or 0 for none. */
  attention?: number;
};

function QuickAccessGrid({ items }: { items: QuickAccessItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="bento-card group flex min-w-0 items-center gap-3 p-4 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
            <Icon name={item.icon} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-on-surface group-hover:text-primary-container">{item.title}</span>
            <span className="block truncate text-xs text-on-surface-variant">{item.hint}</span>
          </span>
          {item.attention ? (
            <span className="shrink-0 rounded-full bg-error/10 px-2 py-0.5 text-xs font-bold tabular-nums text-error">{item.attention}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

/** Every place a role can go, as cards on their dashboard. */
export function QuickAccess({ items }: { items: QuickAccessItem[] }) {
  return (
    <section aria-labelledby="quick-access-heading" className="flex flex-col gap-3">
      <h2 id="quick-access-heading" className="font-table-header text-table-header uppercase text-outline">
        Quick Access
      </h2>
      <QuickAccessGrid items={items} />
    </section>
  );
}

/** The same cards, gathered under headings for a role with many places to go. */
export function QuickAccessGroups({ groups }: { groups: { title: string; items: QuickAccessItem[] }[] }) {
  return (
    <div className="flex flex-col gap-gutter">
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.title} aria-label={group.title} className="flex flex-col gap-3">
            <h2 className="font-table-header text-table-header uppercase text-outline">{group.title}</h2>
            <QuickAccessGrid items={group.items} />
          </section>
        ))}
    </div>
  );
}
