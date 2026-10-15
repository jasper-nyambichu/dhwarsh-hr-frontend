import "server-only";

import { api } from "@/app/lib/api-client";
import type { AgentResponse, BranchResponse, DepartmentResponse } from "@/types";
import type { AgentPayrollSummaryResponse } from "@/types/agent-portal";
import type {
  PayrollRunRequest,
  PayrollRunResponse,
  PayslipResponse,
} from "@/types/payroll";

/**
 * `controller/payroll/PayrollController` — base `/payroll`.
 *
 * A run is synchronous: `POST /payroll/run` calculates every payslip, the agent
 * summaries and the advance/loan recoveries in ONE transaction, then returns the
 * finished run. There is no draft / approval / preview stage.
 */

export function runPayroll(request: PayrollRunRequest): Promise<PayrollRunResponse> {
  return api.post<PayrollRunResponse>("/payroll/run", request);
}

/** Every run, newest period first. */
export function getPayrollRuns(signal?: AbortSignal): Promise<PayrollRunResponse[]> {
  return api.get<PayrollRunResponse[]>("/payroll/runs", { signal });
}

export function getPayrollRun(id: number, signal?: AbortSignal): Promise<PayrollRunResponse> {
  return api.get<PayrollRunResponse>(`/payroll/runs/${id}`, { signal });
}

export function getRunPayslips(runId: number, signal?: AbortSignal): Promise<PayslipResponse[]> {
  return api.get<PayslipResponse[]>(`/payroll/runs/${runId}/payslips`, { signal });
}

export function getRunAgentSummaries(
  runId: number,
  signal?: AbortSignal,
): Promise<AgentPayrollSummaryResponse[]> {
  return api.get<AgentPayrollSummaryResponse[]>(`/payroll/runs/${runId}/agent-summaries`, { signal });
}

/** One payslip. Staff read any; an employee only their own (enforced server-side). */
export function getPayslip(id: number, signal?: AbortSignal): Promise<PayslipResponse> {
  return api.get<PayslipResponse>(`/payroll/payslips/${id}`, { signal });
}

/** The signed-in employee's payslips, newest period first. EMPLOYEE principal only. */
export function getMyPayslips(signal?: AbortSignal): Promise<PayslipResponse[]> {
  return api.get<PayslipResponse[]>("/payroll/my-payslips", { signal });
}

/**
 * What a payroll run can be scoped to. Departments have no list-all endpoint, so
 * they are fetched branch by branch. Inactive branches/agents are dropped.
 */
export async function getScopeOptions(): Promise<{
  branches: BranchResponse[];
  agents: AgentResponse[];
  departments: DepartmentResponse[];
}> {
  const [allBranches, allAgents] = await Promise.all([
    api.get<BranchResponse[]>("/branches"),
    api.get<AgentResponse[]>("/agents"),
  ]);

  const branches = allBranches.filter((branch) => branch.status === "ACTIVE");
  const agents = allAgents.filter((agent) => agent.status === "ACTIVE");

  const departments = (
    await Promise.all(
      branches.map((branch) => api.get<DepartmentResponse[]>(`/departments/by-branch/${branch.id}`)),
    )
  ).flat();

  return { branches, agents, departments };
}