import "server-only";

import { api } from "@/app/lib/api-client";
import type { DamageResponse } from "@/types/backoffice";

/** `controller/damage/DamageController` — base `/damages`. */

/** Every damage recorded against this employee, newest first. */
export function getEmployeeDamages(employeeId: number, signal?: AbortSignal): Promise<DamageResponse[]> {
  return api.get<DamageResponse[]>("/damages", { query: { employeeId }, signal });
}

/** Refused by the backend once the damage has been deducted. A cancelled damage cannot be brought back. */
export function cancelDamage(id: number): Promise<DamageResponse> {
  return api.put<DamageResponse>(`/damages/${id}/cancel`);
}
