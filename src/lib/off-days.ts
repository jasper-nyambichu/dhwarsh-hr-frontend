import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  max,
  min,
  parse,
  parseISO,
  startOfMonth,
} from "date-fns";

import type { OffDayResponse } from "@/types/off-day";

/** A month is carried in the URL as yyyy-MM. Anything else means the current month. */
export function parseMonth(value: string | undefined): string {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : format(new Date(), "yyyy-MM");
}

function monthStart(month: string): Date {
  return parse(`${month}-01`, "yyyy-MM-dd", new Date());
}

export function monthRange(month: string): { from: string; to: string } {
  const start = monthStart(month);
  return { from: format(start, "yyyy-MM-dd"), to: format(endOfMonth(start), "yyyy-MM-dd") };
}

export function shiftMonth(month: string, by: number): string {
  return format(addMonths(monthStart(month), by), "yyyy-MM");
}

export function monthLabel(month: string): string {
  return format(monthStart(month), "MMMM yyyy");
}

/** How many of this off day's days fall inside the month: one can run across two months. */
export function daysInMonth(offDay: OffDayResponse, month: string): number {
  const start = monthStart(month);
  const from = max([parseISO(offDay.startDate), startOfMonth(start)]);
  const to = min([parseISO(offDay.endDate), endOfMonth(start)]);
  return Math.max(differenceInCalendarDays(to, from) + 1, 0);
}

/** Who is off on each day of the month, keyed yyyy-MM-dd. */
export function offDaysByDate(offDays: OffDayResponse[], month: string): Map<string, OffDayResponse[]> {
  const start = monthStart(month);
  const byDate = new Map<string, OffDayResponse[]>();

  for (const offDay of offDays) {
    if (daysInMonth(offDay, month) === 0) continue;
    const days = eachDayOfInterval({
      start: max([parseISO(offDay.startDate), startOfMonth(start)]),
      end: min([parseISO(offDay.endDate), endOfMonth(start)]),
    });
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      byDate.set(key, [...(byDate.get(key) ?? []), offDay]);
    }
  }

  return byDate;
}

export type EmployeeOffDays = {
  employeeId: number;
  employeeName: string;
  employeeNumber: string | null;
  branchName: string | null;
  agentName: string | null;
  totalDays: number;
  offDays: OffDayResponse[];
};

/** The month's off days gathered per employee, by name. */
export function groupByEmployee(offDays: OffDayResponse[], month: string): EmployeeOffDays[] {
  const groups = new Map<number, EmployeeOffDays>();

  for (const offDay of offDays) {
    const group = groups.get(offDay.employeeId) ?? {
      employeeId: offDay.employeeId,
      employeeName: offDay.employeeName ?? `Employee #${offDay.employeeId}`,
      employeeNumber: offDay.employeeNumber,
      branchName: offDay.branchName,
      agentName: offDay.agentName,
      totalDays: 0,
      offDays: [],
    };
    group.totalDays += daysInMonth(offDay, month);
    group.offDays.push(offDay);
    groups.set(offDay.employeeId, group);
  }

  return [...groups.values()].sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}
