import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import Link from "next/link";

import { OffDayGrid } from "@/components/features/off-days/off-day-grid";
import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/ui/icon";
import { formatNumber } from "@/lib/format";
import { monthLabel, offDaysByDate, shiftMonth } from "@/lib/off-days";
import type { OffDayResponse } from "@/types/off-day";

/** Previous, current and next month. The other query values are kept when moving. */
export function MonthNav({ month, hrefFor }: { month: string; hrefFor: (month: string) => string }) {
  const stepClass =
    "flex size-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low";

  return (
    <nav aria-label="Choose a month" className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
      <Link href={hrefFor(shiftMonth(month, -1))} aria-label="Previous month" className={stepClass}>
        <Icon name="chevron_left" />
      </Link>
      <span className="min-w-0 px-2 text-center font-body-md text-body-md font-semibold text-on-surface sm:min-w-40">
        {monthLabel(month)}
      </span>
      <Link href={hrefFor(shiftMonth(month, 1))} aria-label="Next month" className={stepClass}>
        <Icon name="chevron_right" />
      </Link>
    </nav>
  );
}

/**
 * The whole month, Monday first. A phone has room for a count in each day, a wide screen for names; clicking a day
 * pops up a card with everyone off that day. The list underneath gives every name and reason at any width.
 */
export function OffDayCalendar({
  month,
  offDays,
  showBranch = true,
  showAgent = true,
}: {
  month: string;
  offDays: OffDayResponse[];
  /** Left off once the page is already about one branch. */
  showBranch?: boolean;
  showAgent?: boolean;
}) {
  const firstOfMonth = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(firstOfMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(firstOfMonth), { weekStartsOn: 1 }),
  });
  const byDate = offDaysByDate(offDays, month);
  const today = format(new Date(), "yyyy-MM-dd");
  const daysWithPeople = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex min-w-0 flex-col gap-gutter">
      <BentoCard title={monthLabel(month)}>
        <OffDayGrid
          cells={days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = key.startsWith(month);
            return {
              key,
              day: format(day, "d"),
              longDate: format(day, "EEEE, dd MMMM yyyy"),
              inMonth,
              isToday: key === today,
              people: (inMonth ? (byDate.get(key) ?? []) : []).map((person) => ({
                id: person.id,
                name: person.employeeName ?? `Employee #${person.employeeId}`,
                detail: [person.employeeNumber, showBranch ? person.branchName : null, showAgent ? person.agentName : null].filter(Boolean).join(" · "),
                reason: person.reason,
              })),
            };
          })}
        />
      </BentoCard>

      <BentoCard title="Who is off" subtitle={`${formatNumber(daysWithPeople.length)} day${daysWithPeople.length === 1 ? "" : "s"} with someone off in ${monthLabel(month)}`}>
        {daysWithPeople.length === 0 ? (
          <EmptyState symbol="event_available" title="Nobody is off this month" description="Days given off appear here." />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {daysWithPeople.map(([key, people]) => (
              <li key={key} id={`off-${key}`} className="min-w-0 scroll-mt-24 rounded-lg border border-outline-variant/40 p-3">
                <p className="font-semibold text-on-surface">{format(parse(key, "yyyy-MM-dd", new Date()), "EEE, dd MMM yyyy")}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {people.map((person) => (
                    <li key={person.id} className="min-w-0 text-sm">
                      <span className="block break-words font-medium text-on-surface">{person.employeeName ?? `Employee #${person.employeeId}`}</span>
                      <span className="block break-words text-xs text-on-surface-variant">
                        {[person.employeeNumber, showBranch ? person.branchName : null, showAgent ? person.agentName : null].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </BentoCard>
    </div>
  );
}
