import "server-only";

import { api } from "@/app/lib/api-client";
import type { Role, UserSummaryResponse } from "@/types";

/**
 * `controller/auth/UserController` — base `/users`.
 *
 * The list and the deactivate are two different audiences, which is the whole
 * reason this module documents them separately:
 *
 *   GET  /users              → SUPER_ADMIN, ADMIN
 *   PUT  /users/{id}/deactivate → SUPER_ADMIN only
 *   POST /users              → SUPER_ADMIN only
 *
 * So an ADMIN may read the directory but may not deactivate or create — the
 * UI hides those controls for ADMIN rather than rendering buttons that 403.
 * That is a deliberate frontend rule mirroring `@PreAuthorize`, not a backend
 * restriction being worked around.
 *
 * `GET /users` returns a bare `List<UserSummaryResponse>`, not a page: there is
 * no paging on this endpoint, so a paged table here would be theatre.
 */

/** The signed-in account as it stands now. */
export function getMe(signal?: AbortSignal): Promise<UserSummaryResponse> {
  return api.get<UserSummaryResponse>("/users/me", { signal });
}

/** Admin: lets a Branch Manager run the agent payment calculation, or takes it back. */
export function setRunPayments(userId: number, allowed: boolean): Promise<UserSummaryResponse> {
  return api.put<UserSummaryResponse>(`/users/${userId}/run-payments`, { allowed });
}

/** Every account. SUPER_ADMIN and ADMIN. */
export function getUsers(signal?: AbortSignal): Promise<UserSummaryResponse[]> {
  return api.get<UserSummaryResponse[]>("/users", { signal });
}

/** Deletes an account. Refused for your own account and for the last active Admin. */
export function deleteUser(userId: number): Promise<void> {
  return api.delete<void>(`/users/${userId}`);
}

export type Credentials = { username: string; password?: string };

/** The Admin sets a branch's Branch Manager or Back Office login. Refused if the branch already has one. */
export function createBranchLogin(branchId: number, role: Role, credentials: Credentials): Promise<UserSummaryResponse> {
  return api.post<UserSummaryResponse>(`/users/branches/${branchId}/login`, credentials, { query: { role } });
}

/** The Admin sets an agent's login. Refused if the agent already has one. */
export function createAgentLogin(agentId: number, credentials: Credentials): Promise<UserSummaryResponse> {
  return api.post<UserSummaryResponse>(`/users/agents/${agentId}/login`, credentials);
}

/** Changes a Branch Manager, Back Office or agent login. Leaving the password out keeps the current one. */
export function changeCredentials(userId: number, credentials: Credentials): Promise<UserSummaryResponse> {
  return api.put<UserSummaryResponse>(`/users/${userId}/credentials`, credentials);
}

/** Which branch a Back Office officer works at. Their dashboard then shows that branch only. */
export function assignUserBranch(userId: number, branchId: number): Promise<UserSummaryResponse> {
  return api.put<UserSummaryResponse>(`/users/${userId}/branch`, { branchId });
}

/**
 * Deactivates an account. SUPER_ADMIN only.
 *
 * There is no matching reactivate endpoint — reactivation is not currently a
 * product capability, so nothing here pretends otherwise.
 */
export function deactivateUser(userId: number): Promise<void> {
  return api.put<void>(`/users/${userId}/deactivate`);
}
