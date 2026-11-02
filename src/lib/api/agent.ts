import "server-only";

import { api } from "@/app/lib/api-client";
import type { AgentResponse, ChargeType, EmployeeSummaryResponse } from "@/types";

/**
 * `controller/agent/AgentController` — base `/agents`.
 *
 * All three reads return bare `ApiResponse<List<…>>`, not a page: the backend
 * loads the whole agent table and there is no `GET /agents` paging. That is
 * fine for a labour-supplier list in the tens; if it ever grows past a few
 * hundred this module is where paging gets added, and the page that calls it
 * will need a `Paginated<T>` in place of the array.
 */

/** Every agent. Open to SUPER_ADMIN, ADMIN and PAYROLL_OFFICER. */
export function getAgents(signal?: AbortSignal): Promise<AgentResponse[]> {
  return api.get<AgentResponse[]>("/agents", { signal });
}

/** One agent. Also open to PAYROLL_OFFICER and to the agent itself. */
export function getAgent(
  id: number,
  signal?: AbortSignal,
): Promise<AgentResponse> {
  return api.get<AgentResponse>(`/agents/${id}`, { signal });
}

/** The signed-in agent's own profile. AGENT principal only. */
export function getMyAgent(signal?: AbortSignal): Promise<AgentResponse> {
  return api.get<AgentResponse>("/agents/me", { signal });
}

/** Staff deployed by one agent. */
export function getAgentStaff(
  agentId: number,
  signal?: AbortSignal,
): Promise<EmployeeSummaryResponse[]> {
  return api.get<EmployeeSummaryResponse[]>(`/employees/by-agent/${agentId}`, {
    signal,
  });
}

/** Payload for create and update. The backend replaces every field on save. */
export type AgentInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
  directorName: string;
  chargeType: ChargeType;
  chargeAmount: number | null;
  chargePercentage: number | null;
  vatRegistered: boolean;
  contactPerson?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  kraPin?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
};

export function createAgent(payload: AgentInput): Promise<AgentResponse> {
  return api.post<AgentResponse>("/agents", payload);
}

export function updateAgent(id: number, payload: AgentInput): Promise<AgentResponse> {
  return api.put<AgentResponse>(`/agents/${id}`, payload);
}

/** Saves a photo of the director's ID, replacing any before it. PNG or JPEG, up to 5 MB. */
export function uploadDirectorId(id: number, body: FormData): Promise<AgentResponse> {
  return api.post<AgentResponse>(`/agents/${id}/director-id`, body);
}

/**
 * Deactivates an agent.
 *
 * SUPER_ADMIN only — `AgentController.deactivateAgent` is `hasRole('SUPER_ADMIN')`,
 * while `createAgent`/`updateAgent` accept ADMIN too. The UI must therefore hide
 * this control for ADMIN rather than render it and let the request 403.
 */
export function deactivateAgent(id: number): Promise<void> {
  return api.put<void>(`/agents/${id}/deactivate`);
}
