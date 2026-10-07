import "server-only";

import { api } from "@/app/lib/api-client";
import type { UserSummaryResponse } from "@/types";

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

/** Every account. SUPER_ADMIN and ADMIN. */
export function getUsers(signal?: AbortSignal): Promise<UserSummaryResponse[]> {
  return api.get<UserSummaryResponse[]>("/users", { signal });
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
