"use client";

import { useState } from "react";

import { offDayDates } from "@/components/features/off-days/employee-off-day-cards";
import { GiveOffDayDialog, OffDayRowActions } from "@/components/features/off-days/off-day-form";
import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/ui/icon";
import { formatNumber, initials } from "@/lib/format";
import { MAX_OFF_DAYS_PER_MONTH, isOffOn, offDatesInMonth } from "@/lib/off-days";
import type { OffDayResponse } from "@/types/off-day";

export type OffDayEmployee = { id: number; fullName: string; employeeNumber: string; departmentName: string | null };

/** @deprecated name kept for the agent pages; see {@link OffDayEmployee}. */
export type AgentOffEmployee = OffDayEmployee;

/**
 * Employees at one branch, each with their Give Off button and their days off this month (Change / Remove for
 * those still ahead). Used by the agent for their own employees, and by the Branch Manager and the Admin when the
 * agent isn't available.
 */
export function AgentEmployeeOffCards({
  employees,
  offDays,
  month,
  today,
  title = "Your employees here",
  subtitle = `Press Give Off next to the employee: ${MAX_OFF_DAYS_PER_MONTH} separate days each month.`,
}: {
  employees: OffDayEmployee[];
  offDays: OffDayResponse[];
  month: string;
  today: string;
  title?: string;
  subtitle?: string;
}) {
  const [granting, setGranting] = useState<OffDayEmployee | null>(null);
  const [search, setSearch] = useState("");

  // Finds an employee by any part of their name, employee number or department, ignoring case and extra spaces.
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = words.length === 0
    ? employees
    : employees.filter((person) => {
        const text = [person.fullName, person.employeeNumber, person.departmentName].filter(Boolean).join(" ").toLowerCase();
        return words.every((word) => text.includes(word));
      });

  return (
    <BentoCard title={title} subtitle={subtitle}>
      <div className="flex flex-col gap-3">
        {employees.length > 0 ? (
          <div role="search" className="relative">
            <label htmlFor="off-day-search" className="sr-only">Search employees</label>
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex h-11 items-center text-outline">
              <Icon name="search" className="text-[20px] leading-none" />
            </span>
            {/* A plain text box: a "search" box adds the browser's own second clear button. */}
            <input
              id="off-day-search"
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, employee number or department"
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-10 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search ? (
              <button data-live=""
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear the search"
                className="absolute right-2 top-1.5 flex size-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            ) : null}
            {words.length > 0 ? (
              <p className="mt-1.5 text-xs text-on-surface-variant" aria-live="polite">
                {formatNumber(shown.length)} of {formatNumber(employees.length)} employee{employees.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
        ) : null}

        {employees.length === 0 ? (
          <EmptyState symbol="group" title="No active employees" description="There are no active employees at this branch." />
        ) : shown.length === 0 ? (
          <EmptyState symbol="person_search" title="No employee matches" description={`Nobody here matches "${search.trim()}". Check the spelling, or search by employee number.`} />
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((person) => {
              const own = offDays.filter((offDay) => offDay.employeeId === person.id);
              const offToday = own.some((offDay) => isOffOn(offDay, today));
              const used = offDatesInMonth(offDays, person.id, month).length;
              const full = used >= MAX_OFF_DAYS_PER_MONTH;

              return (
                <li key={person.id} className="min-w-0 rounded-lg border border-outline-variant/40 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary">
                      {initials(person.fullName)}
                    </span>
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="flex flex-wrap items-center gap-x-2 break-words font-semibold text-on-surface">
                        {person.fullName}
                        {offToday ? (
                          <span className="rounded-full bg-blue-soft px-2 py-0.5 text-[11px] font-bold text-primary-container">Off today</span>
                        ) : null}
                      </p>
                      <p className="break-words text-xs text-on-surface-variant">
                        {[person.employeeNumber, person.departmentName].filter(Boolean).join(" · ")}
                        {` · ${formatNumber(used)} of ${MAX_OFF_DAYS_PER_MONTH} days off given`}
                      </p>
                    </div>
                    <button data-live=""
                      type="button"
                      onClick={() => setGranting(person)}
                      className={
                        full
                          ? "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low sm:w-auto"
                          : "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container sm:w-auto"
                      }
                    >
                      <Icon name={full ? "event_busy" : "event_available"} className="text-[18px]" />
                      {full ? "Both given" : "Give Off"}
                    </button>
                  </div>

                  {own.length > 0 ? (
                    <ul className="mt-3 flex flex-col divide-y divide-outline-variant/30 border-t border-outline-variant/30">
                      {own.map((offDay) => (
                        <li key={offDay.id} className="flex min-w-0 items-center justify-between gap-3 py-1.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-on-surface">{offDayDates(offDay)}</p>
                            {offDay.reason ? <p className="break-words text-xs text-on-surface-variant">{offDay.reason}</p> : null}
                          </div>
                          <OffDayRowActions offDay={offDay} employeeName={person.fullName} today={today} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {granting ? (
        <GiveOffDayDialog
          key={granting.id}
          employee={{ id: granting.id, name: granting.fullName, number: granting.employeeNumber }}
          month={month}
          taken={offDatesInMonth(offDays, granting.id, month)}
          onClose={() => setGranting(null)}
          onSaved={() => setGranting(null)}
        />
      ) : null}
    </BentoCard>
  );
}
