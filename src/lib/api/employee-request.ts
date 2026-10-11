import "server-only";

import { api } from "@/app/lib/api-client";
import type { EmployeeCreationRequestResponse, EmployeeRequestStatus } from "@/types/employee-request";

/**
 * `controller/employee/EmployeeCreationRequestController` — base `/employee-requests`.
 *
 *   POST /employee-requests              HR_MANAGER submits a new request
 *   GET  /employee-requests              ADMIN/SUPER_ADMIN — all requests
 *   GET  /employee-requests/mine         HR_MANAGER — own submissions
 *   GET  /employee-requests/{id}         ADMIN/SUPER_ADMIN/HR_MANAGER (own only for HR)
 *   PUT  /employee-requests/{id}/approve ADMIN/SUPER_ADMIN — creates the employee
 *   PUT  /employee-requests/{id}/reject  ADMIN/SUPER_ADMIN — requires a reason
 */

/** All requests. Optionally filtered by status. ADMIN/SUPER_ADMIN only. */
export function getEmployeeRequests(
  status?: EmployeeRequestStatus,
  signal?: AbortSignal,
): Promise<EmployeeCreationRequestResponse[]> {
  return api.get<EmployeeCreationRequestResponse[]>("/employee-requests", {
    query: { status },
    signal,
  });
}

/** HR_MANAGER's own submissions. */
export function getMyEmployeeRequests(
  signal?: AbortSignal,
): Promise<EmployeeCreationRequestResponse[]> {
  return api.get<EmployeeCreationRequestResponse[]>("/employee-requests/mine", {
    signal,
  });
}

/** One request by id. */
export function getEmployeeRequest(
  id: number,
  signal?: AbortSignal,
): Promise<EmployeeCreationRequestResponse> {
  return api.get<EmployeeCreationRequestResponse>(`/employee-requests/${id}`, {
    signal,
  });
}

/** Approve a pending request — creates the employee. ADMIN/SUPER_ADMIN. */
export function approveEmployeeRequest(
  id: number,
): Promise<EmployeeCreationRequestResponse> {
  return api.put<EmployeeCreationRequestResponse>(`/employee-requests/${id}/approve`);
}

/** Reject a pending request. ADMIN/SUPER_ADMIN. */
export function rejectEmployeeRequest(
  id: number,
  reason: string,
): Promise<EmployeeCreationRequestResponse> {
  return api.put<EmployeeCreationRequestResponse>(`/employee-requests/${id}/reject`, {
    reason,
  });
}
