"use client";

import { useState } from "react";

import { offDayDates } from "@/components/features/off-days/employee-off-day-cards";
import { GiveOffDayDialog, RemoveOffDayButton } from "@/components/features/off-days/off-day-form";
import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/ui/icon";
import { formatNumber, initials } from "@/lib/format";
import { daysInMonth, isOffOn } from "@/lib/off-days";
import type { AgentOffEmployee } from "@/lib/agent-off-days";
import type { OffDayResponse } from "@/types/off-day";

/** The agent's employees at one branch, each with their own Give Off button. */
export function AgentEmployeeOffCards({
  employees,
  offDays,
  month,
  today,
}: {
  employees: AgentOffEmployee[];
  offDays: OffDayResponse[];
  month: string;
  today: string;
}) {
  const [granting, setGranting] = useState<AgentOffEmployee | null>(null);

  return (
    <BentoCard title="Your employees here" subtitle="Press Give Off next to the employee.">
      <div className="flex flex-col gap-3">
        {employees.length === 0 ? (
          <EmptyState symbol="group" title="No active employees" description="You have no active employees at this branch." />
        ) : (
          <ul className="flex flex-col gap-3">
            {employees.map((person) => {
              const own = offDays.filter((offDay) => offDay.employeeId === person.id);
              const offToday = own.some((offDay) => isOffOn(offDay, today));
              const totalDays = own.reduce((sum, offDay) => sum + daysInMonth(offDay, month), 0);

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
                        {totalDays > 0 ? ` · ${formatNumber(totalDays)} day${totalDays === 1 ? "" : "s"} off this month` : ""}
                      </p>
                    </div>
                    <button data-live=""
                      type="button"
                      onClick={() => setGranting(person)}
                      className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container sm:w-auto"
                    >
                      <Icon name="event_available" className="text-[18px]" />
                      Give Off
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
                          {offDay.endDate >= today ? <RemoveOffDayButton id={offDay.id} /> : null}
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
          today={today}
          onClose={() => setGranting(null)}
          onSaved={() => setGranting(null)}
        />
      ) : null}
    </BentoCard>
  );
}
