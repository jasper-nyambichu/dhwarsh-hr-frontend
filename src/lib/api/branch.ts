import "server-only";

import { api } from "@/app/lib/api-client";
import type { BranchResponse } from "@/types";

/**
 * `controller/branch/BranchController` — base `/branches`.
 *
 * `GET /branches` returns the whole table as a bare list, not a page. Branch
 * counts are small and bounded by geography, so paging would be ceremony.
 */

/** Payload for create and update — the backend has one `BranchRequest`. */
export type BranchInput = {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  /** User id of an active BRANCH_MANAGER; omit to leave the branch unassigned. */
  managerId?: number;
};

/** Every branch. SUPER_ADMIN, ADMIN, HR_MANAGER and PAYROLL_OFFICER. */
export function getBranches(signal?: AbortSignal): Promise<BranchResponse[]> {
  return api.get<BranchResponse[]>("/branches", { signal });
}

/** One branch. Also open to a BRANCH_MANAGER reading their own. */
export function getBranch(id: number, signal?: AbortSignal): Promise<BranchResponse> {
  return api.get<BranchResponse>(`/branches/${id}`, { signal });
}

/**
 * The signed-in branch manager's own branch.
 *
 * `BRANCH_MANAGER` only. This is the one call the /branch portal can make
 * before it knows its own branch id, which is why `users.branch_id` being NULL
 * makes that whole portal unusable. Assigning a manager to a branch now sets it.
 */
export function getMyBranch(signal?: AbortSignal): Promise<BranchResponse> {
  return api.get<BranchResponse>("/branches/my-branch", { signal });
}

/** Creates a branch. SUPER_ADMIN and ADMIN. The code is stored upper-case. */
export function createBranch(payload: BranchInput): Promise<BranchResponse> {
  return api.post<BranchResponse>("/branches", payload);
}

/** Updates a branch. SUPER_ADMIN and ADMIN. Omitting `managerId` clears the manager. */
export function updateBranch(id: number, payload: BranchInput): Promise<BranchResponse> {
  return api.put<BranchResponse>(`/branches/${id}`, payload);
}

/**
 * Deactivates a branch. SUPER_ADMIN only, unlike create/update which also accept
 * ADMIN. Refused by the backend while the branch still has active employees.
 */
export function deactivateBranch(id: number): Promise<void> {
  return api.put<void>(`/branches/${id}/deactivate`);
}

/** Reactivates a branch. SUPER_ADMIN only. */
export function activateBranch(id: number): Promise<void> {
  return api.put<void>(`/branches/${id}/activate`);
}