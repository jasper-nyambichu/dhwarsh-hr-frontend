import type { PayrollRunState } from "@/types/payroll";

/**
 * `dto/response/payroll/FinanceRunSummaryResponse` — what one payroll run costs in cash.
 *
 * Direct employees: the company pays their net salary and remits their statutory amounts.
 * Agent-supplied staff: the company pays ONE amount to the agent, which already contains their
 * statutory amounts (the agent remits those), so those payslips are never paid twice.
 */
export type FinanceRunSummary = {
  runId: number;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunState;

  directEmployees: number;
  directNetPay: number;
  directPaye: number;
  directNssf: number;
  directShif: number;
  directHousingLevy: number;
  /** Employer levy on direct staff. */
  directNita: number;
  /** Withheld from direct staff pay to recover loans. */
  directLoanRecoveries: number;

  agentCount: number;
  /** Total of the agents' final amounts payable. */
  agentPayable: number;
  agentVat: number;
  agentPaye: number;
  agentNssf: number;
  agentShif: number;
  agentHousingLevy: number;

  /** Direct net + direct statutory + direct NITA + agent payable. */
  totalCashRequirement: number;
};