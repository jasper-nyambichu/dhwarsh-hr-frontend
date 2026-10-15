import "server-only";

import { api } from "@/app/lib/api-client";
import type { AgentResponse } from "@/types";
import type { AgentAdvanceResponse } from "@/types/agent-portal";

/**
 * `controller/agentadvance/AgentAdvanceController` — base `/agent-advances`.
 *
 * Advances are money the company gives an agent ahead of payroll. Only the Payroll
 * Officer records them (`agentadvance:approve`); the outstanding balance is then
 * subtracted automatically from the agent's next payment, before VAT. Agents can only
 * read their own.
 */

/** The signed-in agent's own advances. AGENT principal only. */
export function getMyAdvances(signal?: AbortSignal): Promise<AgentAdvanceResponse[]> {
  return api.get<AgentAdvanceResponse[]>("/agent-advances/my-advances", { signal });
}

/** Company-wide list, newest first. Staff read roles only. */
export function getAllAdvances(signal?: AbortSignal): Promise<AgentAdvanceResponse[]> {
  return api.get<AgentAdvanceResponse[]>("/agent-advances", { signal });
}

export function getAdvance(id: number, signal?: AbortSignal): Promise<AgentAdvanceResponse> {
  return api.get<AgentAdvanceResponse>(`/agent-advances/${id}`, { signal });
}

export function recordAdvance(request: {
  agentId: number;
  amount: number;
  advanceDate: string;
  purpose?: string;
}): Promise<AgentAdvanceResponse> {
  return api.post<AgentAdvanceResponse>("/agent-advances", request);
}

/** Manual recovery outside payroll (e.g. the agent repaid directly). */
export function recoverAdvance(id: number, amountToRecover: number): Promise<AgentAdvanceResponse> {
  return api.put<AgentAdvanceResponse>(`/agent-advances/${id}/recover`, { amountToRecover });
}

/** Active agents an advance can be recorded for. */
export async function getActiveAgents(signal?: AbortSignal): Promise<AgentResponse[]> {
  const agents = await api.get<AgentResponse[]>("/agents", { signal });
  return agents.filter((agent) => agent.status === "ACTIVE");
}