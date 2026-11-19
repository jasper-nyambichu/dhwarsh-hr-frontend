import "server-only";

import { api } from "@/app/lib/api-client";
import type { AgentPaymentDetail, AgentPaymentReadiness, AgentSettlementResponse, AgentSettlementRunPayload } from "@/types/agent-portal";

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

/** Admin: the same calculation line by line, without saving or deducting anything. Agents never see it. */
export function previewAgentPayments(payload: AgentSettlementRunPayload): Promise<AgentPaymentDetail[]> {
  return api.post<AgentPaymentDetail[]>("/agent-settlements/preview", payload);
}

/** One payment that was run, line by line. The Admin, or the agent it was paid to. */
export function getAgentPaymentDetail(settlementId: number, signal?: AbortSignal): Promise<AgentPaymentDetail> {
  return api.get<AgentPaymentDetail>(`/agent-settlements/${settlementId}/detail`, { signal });
}

/** Admin: what still stands between a period and a calculation. Changes nothing. */
export function getAgentPaymentReadiness(periodStart: string, periodEnd: string): Promise<AgentPaymentReadiness> {
  return api.get<AgentPaymentReadiness>("/agent-settlements/readiness", { query: { periodStart, periodEnd } });
}

/** Admin: every agent's payments, newest period first. */
export function getAgentPayments(signal?: AbortSignal): Promise<AgentSettlementResponse[]> {
  return api.get<AgentSettlementResponse[]>("/agent-settlements", { signal });
}

/** The signed-in agent's own payment statements, newest period first. */
export function getMyAgentPayments(signal?: AbortSignal): Promise<AgentSettlementResponse[]> {
  return api.get<AgentSettlementResponse[]>("/agent-settlements/mine", { signal });
}
