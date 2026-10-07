import "server-only";

import { api } from "@/app/lib/api-client";
import type { BranchResponse } from "@/types";

/**
 * `controller/branch/BranchController` — base `/branches`.
 *
 * `GET /branches` returns the whole table as a bare list, not a page. Branch
 * counts are small and bounded by geography, so paging would be ceremony.
 */

/** Every branch. SUPER_ADMIN and ADMIN only. */
export function getBranches(signal?: AbortSignal): Promise<BranchResponse[]> {
  return api.get<BranchResponse[]>("/branches", { signal });
}

/** One branch. Also open to a BRANCH_MANAGER reading their own. */
export function getBranch(
  id: number,
  signal?: AbortSignal,
): Promise<BranchResponse> {
  return api.get<BranchResponse>(`/branches/${id}`, { signal });
}

/**
 * The signed-in branch manager's own branch.
 *
 * `BRANCH_MANAGER` only. This is the one call the /branch portal can make
 * before it knows its own branch id, which is why `users.branch_id` being NULL
 * makes that whole portal unusable.
 */
export function getMyBranch(signal?: AbortSignal): Promise<BranchResponse> {
  return api.get<BranchResponse>("/branches/my-branch", { signal });
}

/**
 * Deactivates a branch.
 *
 * SUPER_ADMIN only, unlike create/update which also accept ADMIN. Callers must
 * gate the control on the role, not just on `branch:write`.
 */
export function deactivateBranch(id: number): Promise<void> {
  return api.put<void>(`/branches/${id}/deactivate`);
}
