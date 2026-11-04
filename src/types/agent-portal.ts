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
};

/** The body of `POST /agent-settlements/calculate`. Leaving out `agentIds` means every active agent. */
/** `dto/response/settlement/AgentPaymentReadinessResponse`. */
export type AgentPaymentReadiness = {
  periodStart: string;
  periodEnd: string;
  ready: boolean;
  branches: { branchId: number; branchName: string; employeeCount: number; lockedCount: number }[];
  alreadyPaidAgents: string[];
};

export type AgentSettlementRunPayload = {
  periodStart: string;
  periodEnd: string;
  agentIds?: number[];
};
