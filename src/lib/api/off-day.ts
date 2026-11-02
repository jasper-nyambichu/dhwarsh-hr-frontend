import "server-only";

import { api } from "@/app/lib/api-client";
import type { OffDayResponse } from "@/types/off-day";

/**
 * `controller/offday/OffDayController` — base `/off-days`.
 *
 * The agent gives their own employees days off; the Admin reads all of them. A range covers at
 * most 92 days and both dates are inclusive.
 */

type Range = { from: string; to: string };

/** Every off day touching the range. Admin. */
export function getOffDays(range: Range, signal?: AbortSignal): Promise<OffDayResponse[]> {
  return api.get<OffDayResponse[]>("/off-days", { query: { ...range }, signal });
}

/** Off days of the signed-in Branch Manager's own branch touching the range. */
export function getMyBranchOffDays(range: Range, signal?: AbortSignal): Promise<OffDayResponse[]> {
  return api.get<OffDayResponse[]>("/off-days/my-branch", { query: { ...range }, signal });
}

/** The signed-in agent's own employees' off days touching the range. */
export function getMyOffDays(range: Range, signal?: AbortSignal): Promise<OffDayResponse[]> {
  return api.get<OffDayResponse[]>("/off-days/mine", { query: { ...range }, signal });
}

export type OffDayInput = {
  employeeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
};

export function grantOffDay(payload: OffDayInput): Promise<OffDayResponse> {
  return api.post<OffDayResponse>("/off-days", payload);
}

/** Refused by the backend once the off day has fully passed. */
export function removeOffDay(id: number): Promise<void> {
  return api.delete<void>(`/off-days/${id}`);
}
