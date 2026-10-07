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
 * HR's slice of this controller is the final approval stage and the per-employee
 * history:
 *
 *   GET  /leave/types                      no @PreAuthorize — any principal
 *   GET  /leave/pending/hr                 HR_MANAGER, SUPER_ADMIN
 *   GET  /leave/employee/{employeeId}      SUPER_ADMIN, ADMIN, HR_MANAGER
 *   PUT  /leave/{id}/approve-by-hr         HR_MANAGER, SUPER_ADMIN
 *
 * Two absences worth knowing about, because they shape the screens:
 *
 * - There is **no `GET /leave` list** and **no `GET /leave/{id}`**. The only
 *   company-wide view is `/pending/hr`, which is by definition one stage of one
 *   status. An "all leave requests" table cannot be built from this API, and
 *   `/hr/leave/[id]` has no source to read from.
 * - `applyForLeave` and `/my-balance` are `hasRole('EMPLOYEE')`, and
 *   `approve-by-manager` is `hasRole('BRANCH_MANAGER')` — they belong to other
 *   rails and are deliberately not wrapped here.
 */

/** Every configured leave type. Unauthenticated-by-role, so always available. */
export function getLeaveTypes(
  signal?: AbortSignal,
): Promise<LeaveTypeResponse[]> {
  return api.get<LeaveTypeResponse[]>("/leave/types", { signal });
}

/**
 * Requests that have cleared the branch manager and await HR's decision.
 *
 * This is the HR approval queue. It returns only the requests sitting at
 * `PENDING_HR` — approving or rejecting one removes it from the next read.
 */
export function getPendingHrApprovals(
  signal?: AbortSignal,
): Promise<LeaveRequestResponse[]> {
  return api.get<LeaveRequestResponse[]>("/leave/pending/hr", { signal });
}

/** One employee's leave history, newest first. */
export function getLeaveHistoryForEmployee(
  employeeId: number,
  signal?: AbortSignal,
): Promise<LeaveRequestResponse[]> {
  return api.get<LeaveRequestResponse[]>(`/leave/employee/${employeeId}`, {
    signal,
  });
}

/**
 * HR's final decision on a request.
 *
 * Rejection goes through this same call with `approved: false` — there is no
 * separate reject endpoint. `rejectionReason` is only meaningful when rejecting,
 * and the backend does not require it.
 *
 * On approval the controller publishes a `LeaveApprovedEvent` addressed to the
 * employee's user account. If the employee has no account yet (onboarding not
 * finished) it logs a warning and sends nothing — the approval still stands.
 */
export function decideLeaveByHr(
  leaveRequestId: number,
  decision: { approved: boolean; rejectionReason?: string },
): Promise<LeaveRequestResponse> {
  return api.put<LeaveRequestResponse>(
    `/leave/${leaveRequestId}/approve-by-hr`,
    decision,
  );
}

/**
 * Leave balances for one employee.
 *
 * Backed by `GET /leave/my-balance`, which is `hasRole('EMPLOYEE')` — HR cannot
 * read someone else's balance through it. Kept here only so the EMPLOYEE rail
 * has one import site; HR screens must not call it.
 */
export function getMyLeaveBalances(
  signal?: AbortSignal,
): Promise<LeaveBalanceResponse[]> {
  return api.get<LeaveBalanceResponse[]>("/leave/my-balance", { signal });
}
