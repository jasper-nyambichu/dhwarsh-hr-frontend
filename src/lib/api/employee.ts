import "server-only";

import { api } from "@/app/lib/api-client";
import type { EmployeeInput } from "@/app/lib/definitions";
import type { EmployeeResponse, EmployeeSummaryResponse } from "@/types";

/**
 * `controller/employee/EmployeeController` — base `/employees`.
 *
 * There is no `GET /employees` list: the backend only exposes employees
 * through a scope — by branch, by agent, by department, or `/me`. A
 * company-wide employee directory therefore has to be assembled branch by
 * branch. That is a real limitation of the current API, and the reason the
 * `/hr/employees` list cannot be a single call.
 *
 * Note the asymmetry between the two shapes: every `by-*` endpoint returns the
 * thin `EmployeeSummaryResponse`, and only `/{id}` and `/me` return the full
 * `EmployeeResponse`. Salary and statutory identifiers never appear in a list.
 */

/** Employees in one branch. */
export function getEmployeesByBranch(
  branchId: number,
  signal?: AbortSignal,
): Promise<EmployeeSummaryResponse[]> {
  return api.get<EmployeeSummaryResponse[]>(
    `/employees/by-branch/${branchId}`,
    { signal },
  );
}

/** Staff an agent has deployed. */
export function getEmployeesByAgent(
  agentId: number,
  signal?: AbortSignal,
): Promise<EmployeeSummaryResponse[]> {
  return api.get<EmployeeSummaryResponse[]>(`/employees/by-agent/${agentId}`, {
    signal,
  });
}

/** Employees in one department. */
export function getEmployeesByDepartment(
  departmentId: number,
  signal?: AbortSignal,
): Promise<EmployeeSummaryResponse[]> {
  return api.get<EmployeeSummaryResponse[]>(
    `/employees/by-department/${departmentId}`,
    { signal },
  );
}

/** The full record for one employee. */
export function getEmployee(
  id: number,
  signal?: AbortSignal,
): Promise<EmployeeResponse> {
  return api.get<EmployeeResponse>(`/employees/${id}`, { signal });
}

/** The signed-in employee's own record. EMPLOYEE principal only. */
export function getMyEmployeeProfile(
  signal?: AbortSignal,
): Promise<EmployeeResponse> {
  return api.get<EmployeeResponse>("/employees/me", { signal });
}

/** Terminates an employee. SUPER_ADMIN, ADMIN and HR_MANAGER. */
export function terminateEmployee(id: number): Promise<void> {
  return api.put<void>(`/employees/${id}/terminate`);
}

/**
 * Creates an employee. SUPER_ADMIN, ADMIN and HR_MANAGER.
 *
 * The payload is `EmployeeRequest`, which is also what `updateEmployee` takes —
 * there is one DTO, not a create/update pair.
 *
 * Two things the server owns and the caller must not send: `employeeNumber`,
 * generated as `EMP-<branchCode>-<seq>` inside the service, and
 * `employmentStatus`, which is not a field on the request at all.
 *
 * Failure modes the form has to distinguish:
 *   409  a duplicate `nationalId` (the column is UNIQUE) or employee number
 *   404  an unknown `branchId`, `departmentId` or `agentId`
 *   400  a `departmentId` that does not belong to `branchId` — the service
 *        raises InvalidOperationException for that
 */
export function createEmployee(payload: EmployeeInput): Promise<EmployeeResponse> {
  return api.post<EmployeeResponse>("/employees", payload);
}

/** Updates an employee. Same DTO and roles as create. */
export function updateEmployee(
  id: number,
  payload: EmployeeInput,
): Promise<EmployeeResponse> {
  return api.put<EmployeeResponse>(`/employees/${id}`, payload);
}
