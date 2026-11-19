/**
 * Agent Portal response types.
 *
 * Mirrors `dto/response/agentadvance/AgentAdvanceResponse` and
 * `dto/response/settlement/AgentSettlementResponse`.
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
 * What one agent is paid for one period:
 * days pay + PAYE + NSSF + NITA + agent fee + VAT - loans - damages - advances.
 */
export type AgentSettlementResponse = {
  id: number;
  agentId: number;
  agentName: string | null;
  periodStart: string;
  periodEnd: string;
  employeeCount: number;
  daysWorkedTotal: number;
  daysPay: number;
  payeTotal: number;
  nssfTotal: number;
  nitaTotal: number;
  agentFee: number;
  vatRateUsed: number;
  vatAmount: number;
  loanTotal: number;
  damageTotal: number;
  advanceRecovered: number;
  amountPayable: number;
  paymentRequestId: number | null;
  /** SALARY, or DAILY_RATE for payments run before salaries were used. */
  payBasis?: "SALARY" | "DAILY_RATE";
};

/**
 * `dto/response/settlement/AgentPaymentDetail`: one agent's payment line by line. The same for the Admin's preview
 * (`settlementId` null: nothing saved, agents never see it) and for a payment that was run, which the Admin and the
 * agent both read, so the two ends always agree.
 */
export type AgentPaymentDetail = {
  settlementId: number | null;
  agentId: number;
  agentName: string;
  periodStart: string;
  periodEnd: string;
  payBasis: "SALARY" | "DAILY_RATE";
  employees: {
    employeeId: number;
    employeeNumber: string | null;
    employeeName: string;
    branchName: string | null;
    monthlySalary: number | null;
    daysWorked: number;
    offDaysPaid: number;
    dailyRate: number | null;
    pay: number;
    loan: number;
    damage: number;
    netPay: number;
  }[];
  salaries: number;
  paye: number;
  nssf: number;
  nita: number;
  agentFee: number;
  vatRate: number;
  vat: number;
  loans: number;
  damages: number;
  /** Each advance taken back: when it was asked for and approved, and the amount taken off (a minus). */
  advances: {
    advanceId: number;
    purpose: string | null;
    advanceAmount: number | null;
    requestedOn: string | null;
    approvedOn: string | null;
    deducted: number;
    balanceAfter: number;
  }[];
  advanceRecovered: number;
  amountPayable: number;
  paymentRequestId: number | null;
  warnings: string[];
};

/** The body of `POST /agent-settlements/calculate`. Leaving out `agentIds` means every active agent. */
/** `dto/response/settlement/AgentPaymentReadinessResponse`. */
export type AgentPaymentReadiness = {
  periodStart: string;
  periodEnd: string;
  ready: boolean;
  branches: { branchId: number; branchName: string; employeeCount: number; daysWorked: number }[];
  alreadyPaidAgents: string[];
};

export type AgentSettlementRunPayload = {
  periodStart: string;
  periodEnd: string;
  agentIds?: number[];
};
