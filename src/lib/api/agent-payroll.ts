import "server-only";

import { api } from "@/app/lib/api-client";
import type { AgentPayrollSummaryResponse } from "@/types/agent-portal";

/**
 * `controller/payroll/PayrollController` — the agent-facing slice.
 *
 * `GET /payroll/my-agent-summaries` returns the signed-in agent's payment
 * statements across every run, newest period first. PDFs are served by
 * `app/api/agent/documents/[runId]/[kind]/route.ts`, not from here.
 */
export function getMyAgentSummaries(
  signal?: AbortSignal,
): Promise<AgentPayrollSummaryResponse[]> {
  return api.get<AgentPayrollSummaryResponse[]>(
    "/payroll/my-agent-summaries",
    { signal },
  );
}