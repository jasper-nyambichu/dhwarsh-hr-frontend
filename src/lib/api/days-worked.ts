import "server-only";

import { api } from "@/app/lib/api-client";
import type { DaysWorkedResponse } from "@/types/backoffice";

/**
 * `controller/dayswork/DaysWorkedController` — base `/days-worked`.
 *
 * Payroll's input under the days × rate model. The Back Office reviews and locks each branch's
 * days in the desktop application; the web only reads them (Payroll, Admin) and lets an Admin
 * reopen a locked period.
 */

/** Every active employee of the branch: the locked figure if the period is locked, else the live count. */
export function getDaysWorked(
  branchId: number,
  periodStart: string,
  periodEnd: string,
  signal?: AbortSignal,
): Promise<DaysWorkedResponse[]> {
  return api.get<DaysWorkedResponse[]>("/days-worked", {
    query: { branchId, periodStart, periodEnd },
    signal,
  });
}

/** Admin only: reopens a locked period so the Back Office can correct it and lock it again. */
export function unlockDaysWorked(
  branchId: number,
  periodStart: string,
  periodEnd: string,
): Promise<void> {
  return api.delete<void>("/days-worked/lock", {
    query: { branchId, periodStart, periodEnd },
  });
}