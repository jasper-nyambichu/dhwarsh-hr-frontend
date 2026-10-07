import "server-only";

import { api } from "@/app/lib/api-client";
import type { DepartmentResponse } from "@/types";

/**
 * `controller/department/DepartmentController` — base `/departments`.
 *
 * There is deliberately no `getDepartments()`: the backend has no
 * `GET /departments` list endpoint. Departments are only reachable through a
 * branch (`by-branch`) or by id. A flat company-wide department list is a
 * backend gap, not an oversight here — adding it would mean a new controller
 * method, which is outside what the current API can serve.
 */

/** Every department in one branch. */
export function getDepartmentsByBranch(
  branchId: number,
  signal?: AbortSignal,
): Promise<DepartmentResponse[]> {
  return api.get<DepartmentResponse[]>(`/departments/by-branch/${branchId}`, {
    signal,
  });
}

/** One department. */
export function getDepartment(
  id: number,
  signal?: AbortSignal,
): Promise<DepartmentResponse> {
  return api.get<DepartmentResponse>(`/departments/${id}`, { signal });
}

/** Deletes a department. SUPER_ADMIN and ADMIN. */
export function deleteDepartment(id: number): Promise<void> {
  return api.delete<void>(`/departments/${id}`);
}
