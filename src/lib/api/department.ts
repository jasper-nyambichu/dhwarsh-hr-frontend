import "server-only";

import { api } from "@/app/lib/api-client";
import type { CompanyDepartment } from "@/types/staff";

/**
 * `controller/department/DepartmentController` — base `/departments`.
 *
 * Departments are company-wide: one list shared by every branch. Admin creates and edits them;
 * Branch Managers and Agents read the list to assign or choose one.
 */

/** Every department, by name. */
export function getDepartments(signal?: AbortSignal): Promise<CompanyDepartment[]> {
  return api.get<CompanyDepartment[]>("/departments", { signal });
}

/**
 * Kept for screens written against the old per-branch endpoint: it now returns the same
 * company-wide list whatever the branch id.
 */
export function getDepartmentsByBranch(
  branchId: number,
  signal?: AbortSignal,
): Promise<CompanyDepartment[]> {
  return api.get<CompanyDepartment[]>(`/departments/by-branch/${branchId}`, { signal });
}

export function getDepartment(id: number, signal?: AbortSignal): Promise<CompanyDepartment> {
  return api.get<CompanyDepartment>(`/departments/${id}`, { signal });
}

/** Deletes a department. Refused by the backend while employees are still assigned to it. */
export function deleteDepartment(id: number): Promise<void> {
  return api.delete<void>(`/departments/${id}`);
}

/** Payload for create and update. */
export type DepartmentInput = {
  name: string;
};

export function createDepartment(payload: DepartmentInput): Promise<CompanyDepartment> {
  return api.post<CompanyDepartment>("/departments", payload);
}

export function updateDepartment(id: number, payload: DepartmentInput): Promise<CompanyDepartment> {
  return api.put<CompanyDepartment>(`/departments/${id}`, payload);
}