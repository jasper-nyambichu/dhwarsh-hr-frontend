import "server-only";

import { api } from "@/app/lib/api-client";
import type { AgentSettlementResponse, AgentSettlementRunPayload } from "@/types/agent-portal";

/**
 * `controller/settlement/AgentSettlementController` — base `/agent-settlements`.
 *
 * What each agent is paid per period. PDFs are served by
 * `app/api/agent/documents/[settlementId]/[kind]/route.ts`, not from here.
 */

/** Admin: works out every chosen agent's amount for the period. All or nothing. */
export function calculateAgentPayments(payload: AgentSettlementRunPayload): Promise<AgentSettlementResponse[]> {
  return api.post<AgentSettlementResponse[]>("/agent-settlements/calculate", payload);
}

/** Admin: every agent's payments, newest period first. */
export function getAgentPayments(signal?: AbortSignal): Promise<AgentSettlementResponse[]> {
  return api.get<AgentSettlementResponse[]>("/agent-settlements", { signal });
}

/** The signed-in agent's own payment statements, newest period first. */
export function getMyAgentPayments(signal?: AbortSignal): Promise<AgentSettlementResponse[]> {
  return api.get<AgentSettlementResponse[]>("/agent-settlements/mine", { signal });
}
