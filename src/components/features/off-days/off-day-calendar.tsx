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

import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/ui/icon";
import { formatNumber } from "@/lib/format";
import { monthLabel, offDaysByDate, shiftMonth } from "@/lib/off-days";
import { cn } from "@/lib/utils";
import type { OffDayResponse } from "@/types/off-day";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Names that fit inside a day on a wide screen. The list under the calendar always has everyone. */
const NAMES_IN_CELL = 2;

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
 * The whole month, Monday first. A phone has room for a count in each day, a wide screen for names;
 * the list underneath gives every name and reason at any width.
 */
export function OffDayCalendar({ month, offDays }: { month: string; offDays: OffDayResponse[] }) {
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
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-outline-variant/40 bg-outline-variant/40">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="bg-surface-container-low px-0.5 py-2 text-center font-table-header text-[10px] uppercase text-outline sm:text-table-header">
              {weekday}
            </div>
          ))}

          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = key.startsWith(month);
            const people = inMonth ? (byDate.get(key) ?? []) : [];
            const extra = people.length - NAMES_IN_CELL;
            const number = (
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  key === today ? "bg-primary text-on-primary" : inMonth ? "text-on-surface" : "text-outline/50",
                )}
              >
                {format(day, "d")}
              </span>
            );
            const content = (
              <>
                <span className="flex flex-col items-center gap-1 lg:flex-row lg:justify-between">
                  {number}
                  {people.length > 0 ? (
                    <span className="rounded-full bg-primary-container px-1.5 text-[10px] font-bold tabular-nums text-on-primary lg:hidden">
                      {people.length}
                    </span>
                  ) : null}
                </span>
                {people.length > 0 ? (
                  <span className="mt-1 hidden min-w-0 flex-col gap-0.5 lg:flex">
                    {people.slice(0, NAMES_IN_CELL).map((person) => (
                      <span key={person.id} className="truncate rounded bg-primary-container/10 px-1.5 py-0.5 text-[11px] font-medium text-primary-container">
                        {person.employeeName ?? `Employee #${person.employeeId}`}
                      </span>
                    ))}
                    {extra > 0 ? <span className="px-1.5 text-[10px] text-on-surface-variant">+{extra} more</span> : null}
                  </span>
                ) : null}
              </>
            );
            const cellClass = cn(
              "block min-h-16 min-w-0 p-1 sm:p-1.5 lg:min-h-28",
              inMonth ? "bg-surface-container-lowest" : "bg-surface-container-low/60",
            );

            return people.length > 0 ? (
              <a
                key={key}
                href={`#off-${key}`}
                aria-label={`${format(day, "d MMMM")}: ${people.length} off`}
                className={cn(cellClass, "transition-colors hover:bg-surface-container-low")}
              >
                {content}
              </a>
            ) : (
              <div key={key} className={cellClass}>{content}</div>
            );
          })}
        </div>
      </BentoCard>

      <BentoCard title="Who is off" subtitle={`${formatNumber(daysWithPeople.length)} day${daysWithPeople.length === 1 ? "" : "s"} with someone off in ${monthLabel(month)}`}>
        {daysWithPeople.length === 0 ? (
          <EmptyState symbol="event_available" title="Nobody is off this month" description="Days an agent gives an employee off appear here." />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {daysWithPeople.map(([key, people]) => (
              <li key={key} id={`off-${key}`} className="min-w-0 scroll-mt-24 rounded-lg border border-outline-variant/40 p-3">
                <p className="font-semibold text-on-surface">{format(parse(key, "yyyy-MM-dd", new Date()), "EEE d MMM")}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {people.map((person) => (
                    <li key={person.id} className="min-w-0 text-sm">
                      <span className="block break-words font-medium text-on-surface">{person.employeeName ?? `Employee #${person.employeeId}`}</span>
                      <span className="block break-words text-xs text-on-surface-variant">
                        {[person.branchName, person.agentName].filter(Boolean).join(" · ") || "—"}
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
