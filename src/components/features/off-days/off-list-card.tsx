import Link from "next/link";

import { offDayDates } from "@/components/features/off-days/employee-off-day-cards";
import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatNumber, initials } from "@/lib/format";
import { monthLabel, type EmployeeOffDays } from "@/lib/off-days";
import { cn } from "@/lib/utils";

/**
 * Everyone off in a month, for a dashboard: each employee once, with their dates and day count. The list
 * scrolls when it is long, so nobody is cut off and the page stays a sensible length.
 */
export function OffListCard({
  groups,
  month,
  href,
  showBranch = false,
  wide = false,
  emptyDescription,
  className,
}: {
  /** Null when the off days could not be read, which must not look like nobody being off. */
  groups: EmployeeOffDays[] | null;
  /** yyyy-MM */
  month: string;
  href: string;
  showBranch?: boolean;
  /** Full-width placement: lays the names out in columns. */
  wide?: boolean;
  emptyDescription: string;
  className?: string;
}) {
  const totalDays = groups?.reduce((sum, group) => sum + group.totalDays, 0) ?? 0;
  const subtitle =
    groups && groups.length > 0
      ? `${monthLabel(month)} · ${formatNumber(groups.length)} employee${groups.length === 1 ? "" : "s"} · ${formatNumber(totalDays)} day${totalDays === 1 ? "" : "s"}`
      : monthLabel(month);

  return (
    <BentoCard
      className={className}
      title="Off List This Month"
      subtitle={subtitle}
      action={<Link href={href} className="text-[10px] font-semibold text-primary hover:underline">Open</Link>}
    >
      {groups === null ? (
        <p className="py-2 text-sm text-on-surface-variant">The off list could not be loaded. Please try again in a few minutes.</p>
      ) : groups.length === 0 ? (
        <EmptyState symbol="event_available" title="Nobody is off this month" description={emptyDescription} />
      ) : (
        <ul className={cn("no-scrollbar max-h-96 overflow-y-auto", wide ? "grid grid-cols-1 gap-x-gutter md:grid-cols-2 xl:grid-cols-3" : "flex flex-col")}>
          {groups.map((group) => (
            <li key={group.employeeId} className="flex min-w-0 items-start gap-3 border-b border-outline-variant/20 py-2.5">
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary">
                {initials(group.employeeName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-medium text-on-surface">{group.employeeName}</span>
                {showBranch && group.branchName ? (
                  <span className="block break-words text-xs text-outline">{group.branchName}</span>
                ) : null}
                <span className="block break-words text-xs text-on-surface-variant">
                  {group.offDays.map(offDayDates).join(", ")}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-on-surface">
                {formatNumber(group.totalDays)} day{group.totalDays === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </BentoCard>
  );
}
