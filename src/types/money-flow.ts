/** `dto/response/loan/LoanResponse`. Statuses: PENDING, APPROVED, REJECTED, CLOSED (fully repaid). */
export type LoanItem = {
  id: number;
  employeeId: number;
  employeeName: string | null;
  principalAmount: number;
  interestRate: number | null;
  totalRepayable: number | null;
  installmentAmount: number;
  outstandingBalance: number | null;
  requestDate: string | null;
  approvalDate: string | null;
  status: string;
};

/** The body of `POST /loans/agent-request`. The interest is fixed by the approver, never the agent. */
export type LoanRequestPayload = {
  employeeId: number;
  principalAmount: number;
  installmentAmount: number;
};

/**
 * `dto/response/agentadvance/AgentAdvanceResponse`.
 * Statuses: PENDING and REJECTED (advances an agent asked for), then OUTSTANDING, PARTIALLY_RECOVERED, FULLY_RECOVERED.
 */
export type AdvanceItem = {
  id: number;
  agentId: number;
  agentName: string | null;
  amount: number;
  advanceDate: string;
  purpose: string | null;
  outstandingBalance: number;
  status: string;
  requestedByAgent: boolean;
  rejectionReason: string | null;
  decidedAt: string | null;
};

export type AdvanceRequestPayload = { amount: number; purpose: string };

export type PaymentRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "RELEASED" | "CANCELLED";

/** `dto/response/payment/PaymentRequestResponse`. */
export type PaymentRequestItem = {
  id: number;
  agentId: number;
  agentName: string | null;
  amount: number;
  purpose: string;
  status: PaymentRequestStatus;
  requestedByName: string | null;
  requestedAt: string;
  decidedByName: string | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  releasedByName: string | null;
  releasedAt: string | null;
  releaseReference: string | null;
  /** Total of the M-Pesa payments recorded against this request. */
  paidTotal: number;
  /** Released money still unpaid. */
  remaining: number;
  paymentCount: number;
};

export type PaymentRequestPayload = { amount: number; purpose: string };

/** `dto/response/payment/EmployeePaymentResponse` — one M-Pesa payment to one employee. */
export type EmployeePaymentItem = {
  id: number;
  paymentRequestId: number;
  agentId: number;
  employeeId: number;
  employeeName: string | null;
  employeeNumber: string | null;
  amount: number;
  mpesaCode: string;
  paidOn: string;
  note: string | null;
  recordedByName: string | null;
  recordedAt: string;
};

export type EmployeePaymentPayload = {
  paymentRequestId: number;
  employeeId: number;
  amount: number;
  mpesaCode: string;
  paidOn?: string;
  note?: string;
};