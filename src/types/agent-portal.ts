/**
 * Agent Portal response types.
 *
 * Mirrors `dto/response/agentadvance/AgentAdvanceResponse` and
 * `dto/response/payroll/AgentPayrollSummaryResponse`.
 *
 * Kept out of `types/index.ts` on purpose: that file's `ADVANCE_STATUSES`
 * lists PENDING / APPROVED / REJECTED / RECOVERED, none of which the backend
 * ever writes. `AgentAdvance.status` is OUTSTANDING -> PARTIALLY_RECOVERED ->
 * FULLY_RECOVERED (see `AgentAdvanceServiceImpl.applyRecovery`).
 */

export const AGENT_ADVANCE_STATUSES = [
  "OUTSTANDING",
  "PARTIALLY_RECOVERED",
  "FULLY_RECOVERED",
] as const;
export type AgentAdvanceStatus = (typeof AGENT_ADVANCE_STATUSES)[number];

export type AgentAdvanceResponse = {
  id: number;
  agentId: number;
  agentName: string | null;
  amount: number;
  advanceDate: string;
  purpose: string | null;
  outstandingBalance: number;
  status: AgentAdvanceStatus;
};

/**
 * One agent's payment statement for one payroll run (proposal section 6).
 * `payrollRunId` is the natural key: there is exactly one summary per agent
 * per run.
 */
export type AgentPayrollSummaryResponse = {
  id: number;
  payrollRunId: number;
  periodStart: string;
  periodEnd: string;
  agentId: number;
  agentName: string | null;
  employeeCount: number | null;
  grossSalaries: number;
  serviceCharge: number;
  shifTotal: number | null;
  nssfTotal: number | null;
  housingLevyTotal: number | null;
  payeTotal: number | null;
  employeeLoanDeductionsTotal: number | null;
  advanceRecoveryTotal: number | null;
  subtotalBeforeVat: number;
  vatApplied: boolean;
  vatRateUsed: number | null;
  vatAmount: number | null;
  finalAmountPayable: number;
};