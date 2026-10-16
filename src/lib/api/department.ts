import "server-only";

import { api } from "@/app/lib/api-client";
import type { DepartmentResponse } from "@/types";

/**
 * `controller/department/DepartmentController` — base `/departments`.
 *
 * `GET /departments` returns every department across every branch (SUPER_ADMIN,
 * ADMIN, HR_MANAGER, PAYROLL_OFFICER). A branch manager reads only their own
 * branch through `by-branch`.
 */

/** Every department across every branch. */
export function getDepartments(signal?: AbortSignal): Promise<DepartmentResponse[]> {
  return api.get<DepartmentResponse[]>("/departments", { signal });
}

/** Every department in one branch. */
export function getDepartmentsByBranch(
  branchId: number,
  signal?: AbortSignal,
): Promise<DepartmentResponse[]> {
  return api.get<DepartmentResponse[]>(`/departments/by-branch/${branchId}`, { signal });
}

/** One department. */
export function getDepartment(id: number, signal?: AbortSignal): Promise<DepartmentResponse> {
  return api.get<DepartmentResponse>(`/departments/${id}`, { signal });
}

/**
 * Deletes a department. SUPER_ADMIN and ADMIN — **not** HR_MANAGER.
 * Refused by the backend while employees are still assigned to it.
 */
export function deleteDepartment(id: number): Promise<void> {
  return api.delete<void>(`/departments/${id}`);
}

/** Payload for create and update — the backend has one `DepartmentRequest`. */
export type DepartmentInput = {
  name: string;
  branchId: number;
  /** An employee of the SAME branch; omit for none. */
  headOfDepartmentId?: number;
};

/** Creates a department. SUPER_ADMIN, ADMIN and HR_MANAGER. */
export function createDepartment(payload: DepartmentInput): Promise<DepartmentResponse> {
  return api.post<DepartmentResponse>("/departments", payload);
}

/**
 * Updates a department. SUPER_ADMIN, ADMIN and HR_MANAGER.
 *
 * `branchId` is part of the payload: moving a department to another branch is
 * refused while it still has employees.
 */
export function updateDepartment(
  id: number,
  payload: DepartmentInput,
): Promise<DepartmentResponse> {
  return api.put<DepartmentResponse>(`/departments/${id}`, payload);
}