import "server-only";

import { api } from "@/app/lib/api-client";
import type { AgentPayrollSummaryResponse } from "@/types/agent-portal";
import type { FinanceRunSummary } from "@/types/finance";

/**
 * `controller/finance/FinanceController` — base `/finance`. Read-only, for the Accounts Office.
 * Admin, Payroll, Accounts Office and Auditor may read.
 */

/** Every run's cash requirement, newest period first. */
export function getFinanceRuns(signal?: AbortSignal): Promise<FinanceRunSummary[]> {
  return api.get<FinanceRunSummary[]>("/finance/runs", { signal });
}

export function getFinanceRun(runId: number, signal?: AbortSignal): Promise<FinanceRunSummary> {
  return api.get<FinanceRunSummary>(`/finance/runs/${runId}`, { signal });
}

/** Every agent statement across every run, newest period first. */
export function getAllAgentSummaries(signal?: AbortSignal): Promise<AgentPayrollSummaryResponse[]> {
  return api.get<AgentPayrollSummaryResponse[]>("/finance/agent-summaries", { signal });
}