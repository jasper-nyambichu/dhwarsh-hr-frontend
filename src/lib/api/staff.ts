import "server-only";

import { api } from "@/app/lib/api-client";
import type { EmployeeResponse } from "@/types";
import type { AgentOption, EmployeeEntryPayload, StaffRequestResponse } from "@/types/staff";

/**
 * Adding staff. Admin adds directly (`POST /employees`); Branch Managers and Agents submit a
 * request (`POST /employee-requests`) that an Admin approves before the employee exists.
 */

/** Admin only — creates the employee immediately. */
export function createEmployeeDirect(payload: EmployeeEntryPayload): Promise<EmployeeResponse> {
  return api.post<EmployeeResponse>("/employees", payload);
}

/** Branch Manager / Agent — proposes an employee for Admin approval. */
export function submitEmployeeRequest(payload: EmployeeEntryPayload): Promise<StaffRequestResponse> {
  return api.post<StaffRequestResponse>("/employee-requests", payload);
}

/** The caller's own submissions and what became of them, newest first. */
export function getMyStaffRequests(signal?: AbortSignal): Promise<StaffRequestResponse[]> {
  return api.get<StaffRequestResponse[]>("/employee-requests/mine", { signal });
}

/** Moves an employee into a company-wide department. */
export function assignEmployeeDepartment(id: number, departmentId: number): Promise<EmployeeResponse> {
  return api.put<EmployeeResponse>(`/employees/${id}/department`, { departmentId });
}

/** Active agents, id and name only. */
export function getAgentOptions(signal?: AbortSignal): Promise<AgentOption[]> {
  return api.get<AgentOption[]>("/agents/options", { signal });
}