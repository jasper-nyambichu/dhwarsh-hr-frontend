import "server-only";

import { api } from "@/app/lib/api-client";
import type {
  LeaveBalanceResponse,
  LeaveRequestResponse,
  LeaveTypeResponse,
} from "@/types";

/**
 * `controller/leave/LeaveController` — base `/leave`.
 *
 * Two-stage approval: the Branch Manager decides first (own branch only), then the Admin gives
 * the final decision. Both stages take the same `{ approved, rejectionReason }` body.
 */

export function getLeaveTypes(signal?: AbortSignal): Promise<LeaveTypeResponse[]> {
  return api.get<LeaveTypeResponse[]>("/leave/types", { signal });
}

/** Requests waiting on the Admin's final decision. Admin (and legacy HR) only. */
export function getPendingHrApprovals(signal?: AbortSignal): Promise<LeaveRequestResponse[]> {
  return api.get<LeaveRequestResponse[]>("/leave/pending/hr", { signal });
}

/** Requests from the signed-in manager's own branch awaiting their decision. BRANCH_MANAGER only. */
export function getPendingManagerApprovals(signal?: AbortSignal): Promise<LeaveRequestResponse[]> {
  return api.get<LeaveRequestResponse[]>("/leave/pending/manager", { signal });
}

export function getLeaveHistoryForEmployee(
  employeeId: number,
  signal?: AbortSignal,
): Promise<LeaveRequestResponse[]> {
  return api.get<LeaveRequestResponse[]>(`/leave/employee/${employeeId}`, { signal });
}

/** Final decision — Admin (and legacy HR). */
export function decideLeaveByHr(
  leaveRequestId: number,
  decision: { approved: boolean; rejectionReason?: string },
): Promise<LeaveRequestResponse> {
  return api.put<LeaveRequestResponse>(`/leave/${leaveRequestId}/approve-by-hr`, decision);
}

/** First-stage decision — the Branch Manager, for their own branch's employees. */
export function decideLeaveByManager(
  leaveRequestId: number,
  decision: { approved: boolean; rejectionReason?: string },
): Promise<LeaveRequestResponse> {
  return api.put<LeaveRequestResponse>(`/leave/${leaveRequestId}/approve-by-manager`, decision);
}

export function getMyLeaveBalances(signal?: AbortSignal): Promise<LeaveBalanceResponse[]> {
  return api.get<LeaveBalanceResponse[]>("/leave/my-balance", { signal });
}