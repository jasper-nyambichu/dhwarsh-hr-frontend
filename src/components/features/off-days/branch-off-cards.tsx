import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { formatNumber, initials } from "@/lib/format";
import type { BranchOffSummary } from "@/lib/off-days";

export type BranchOffCardItem = {
  id: number;
  name: string;
  code?: string;
  status?: string;
  summary: BranchOffSummary;
  /** The agent's own employees here. Left out where it is not known without a read per branch. */
  employeeCount?: number;
  href: string;
};

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={highlight && value > 0 ? "min-w-0 rounded-lg bg-blue-soft p-2" : "min-w-0 rounded-lg bg-surface-container-low p-2"}>
      <dd className={highlight && value > 0 ? "text-lg font-bold tabular-nums text-primary-container" : "text-lg font-bold tabular-nums text-on-surface"}>
        {formatNumber(value)}
      </dd>
      <dt className="break-words text-[11px] leading-tight text-on-surface-variant">{label}</dt>
    </div>
  );
}

/** The way into off days: a card per branch, with who is off there at a glance. */
export function BranchOffCards({ items, emptyDescription }: { items: BranchOffCardItem[]; emptyDescription: string }) {
  if (items.length === 0) {
    return <EmptyState symbol="location_off" title="No branches" description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const { summary } = item;

        return (
          <Link
            key={item.id}
            href={item.href}
            className="bento-card group flex min-w-0 flex-col gap-4 p-4 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-card-padding"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                <Icon name="location_city" />
              </span>
              {item.status ? <StatusBadge status={item.status} /> : null}
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-lg font-bold text-on-surface group-hover:text-primary-container">{item.name}</h2>
              {item.code ? <p className="font-mono text-xs text-outline">{item.code}</p> : null}
              {item.employeeCount !== undefined ? (
                <p className="text-xs text-on-surface-variant">
                  {formatNumber(item.employeeCount)} of your employee{item.employeeCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>

            <dl className="grid grid-cols-3 gap-2">
              {summary.offToday !== null ? <Stat label="Off today" value={summary.offToday} highlight /> : null}
              <Stat label="Off this month" value={summary.employeesOff} />
              <Stat label="Days this month" value={summary.daysOff} />
            </dl>

            <div className="mt-auto border-t border-outline-variant/40 pt-3">
              {summary.people.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Nobody off this month</p>
              ) : (
                <ul className="no-scrollbar flex max-h-44 flex-col gap-2 overflow-y-auto">
                  {summary.people.map((person) => (
                    <li key={person.employeeId} className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-[10px] font-bold text-on-primary">
                        {initials(person.name)}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-sm text-on-surface">{person.name}</span>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-on-surface-variant">
                        {formatNumber(person.days)} day{person.days === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
