import "server-only";

import { api } from "@/app/lib/api-client";
import type { DaysWorkedResponse } from "@/types/backoffice";

/**
 * `controller/dayswork/DaysWorkedController` — base `/days-worked`.
 *
 * Days worked, counted live from attendance. Nothing is locked: the agent payment calculation
 * reads the same count whenever the Admin runs it.
 */

/** Every active employee of the branch with the days counted from attendance. */
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