import "server-only";

import { api } from "@/app/lib/api-client";
import type { StaffRequestResponse } from "@/types/staff";

/**
 * `controller/employee/EmployeeCreationRequestController` — `GET /employee-requests/mine`.
 *
 * The requests the signed-in Branch Manager or Agent submitted, newest first, each with the
 * Administrator's decision (and the reason when it was rejected).
 */
export function getMyStaffRequests(signal?: AbortSignal): Promise<StaffRequestResponse[]> {
  return api.get<StaffRequestResponse[]>("/employee-requests/mine", { signal });
}