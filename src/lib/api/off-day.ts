import "server-only";

import { api } from "@/app/lib/api-client";
import type { OffDayResponse } from "@/types/off-day";

/**
 * `controller/offday/OffDayController` — base `/off-days`.
 *
 * The agent gives their own employees days off (two single days a month); the Branch Manager or the Admin can
 * too, when the agent isn't available. A range read covers at most 92 days and both dates are inclusive.
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
  /** One or two separate days (yyyy-MM-dd). */
  dates: string[];
  reason?: string;
};

export function grantOffDays(payload: OffDayInput): Promise<OffDayResponse[]> {
  return api.post<OffDayResponse[]>("/off-days", payload);
}

/** Moves one off day to another date. */
export function updateOffDay(id: number, payload: { date: string; reason?: string }): Promise<OffDayResponse> {
  return api.put<OffDayResponse>(`/off-days/${id}`, payload);
}

/** Refused by the backend once the off day has fully passed. */
export function removeOffDay(id: number): Promise<void> {
  return api.delete<void>(`/off-days/${id}`);
}
