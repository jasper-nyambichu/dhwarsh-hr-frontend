import type { ReactNode } from "react";

import { formatDate, formatDateRange, formatNumber, initials } from "@/lib/format";
import type { EmployeeOffDays } from "@/lib/off-days";
import type { OffDayResponse } from "@/types/off-day";

export function offDayDates(offDay: OffDayResponse): string {
  return offDay.startDate === offDay.endDate ? formatDate(offDay.startDate) : formatDateRange(offDay.startDate, offDay.endDate);
}

/** One card per employee, listing the days they were given off. `action` adds a control to a row. */
export function EmployeeOffDayCards({
  groups,
  showAgent = true,
  action,
}: {
  groups: EmployeeOffDays[];
  showAgent?: boolean;
  action?: (offDay: OffDayResponse) => ReactNode;
}) {
  return (
    <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 2xl:grid-cols-3">
      {groups.map((group) => (
        <li key={group.employeeId} className="bento-card flex min-w-0 flex-col gap-3 p-4 sm:p-card-padding">
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary">
              {initials(group.employeeName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-on-surface">{group.employeeName}</p>
              <p className="break-words text-xs text-on-surface-variant">
                {[group.employeeNumber, group.branchName, showAgent ? group.agentName : null].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-soft px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary-container">
              {formatNumber(group.totalDays)} day{group.totalDays === 1 ? "" : "s"}
            </span>
          </div>

          <ul className="flex flex-col divide-y divide-outline-variant/30 border-t border-outline-variant/30">
            {group.offDays.map((offDay) => (
              <li key={offDay.id} className="flex min-w-0 items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface">{offDayDates(offDay)}</p>
                  {offDay.reason ? <p className="break-words text-xs text-on-surface-variant">{offDay.reason}</p> : null}
                </div>
                {action?.(offDay)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
