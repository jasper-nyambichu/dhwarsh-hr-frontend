import "server-only";

import { api } from "@/app/lib/api-client";
import type { EmployeeSummaryResponse } from "@/types";
import type {
  AdvanceItem,
  AdvanceRequestPayload,
  EmployeePaymentItem,
  EmployeePaymentPayload,
  LoanItem,
  LoanRequestPayload,
  PaymentRequestItem,
  PaymentRequestPayload,
  PaymentRequestStatus,
} from "@/types/money-flow";

/**
 * The Agent money flow (Phase 5):
 *   `controller/loan/LoanController`                    — loans an agent raises for their employees
 *   `controller/agentadvance/AgentAdvanceController`    — advances an agent requests
 *   `controller/payment/PaymentRequestController`       — money an agent asks for, approved by the Admin,
 *                                                         released by the Accounts Office
 *   `controller/payment/EmployeePaymentController`      — each M-Pesa payment the agent makes
 *
 * Approving or rejecting a LOAN uses `approveLoan` / `rejectLoan` in `lib/api/loan.ts`.
 */

/* ------------------------------------------------------------------ employees */

/** The employees an agent supplies. `GET /employees/by-agent/{agentId}`. */
export function getAgentEmployees(agentId: number, signal?: AbortSignal): Promise<EmployeeSummaryResponse[]> {
  return api.get<EmployeeSummaryResponse[]>(`/employees/by-agent/${agentId}`, { signal });
}

/* ---------------------------------------------------------------------- loans */

export function requestAgentLoan(request: LoanRequestPayload): Promise<LoanItem> {
  return api.post<LoanItem>("/loans/agent-request", request);
}

/** The loans of every employee the agent supplies, newest first. */
export function getAgentLoans(signal?: AbortSignal): Promise<LoanItem[]> {
  return api.get<LoanItem[]>("/loans/my-agent-loans", { signal });
}

/** Company-wide, newest first. `status` is optional. */
export function getLoans(status?: string, signal?: AbortSignal): Promise<LoanItem[]> {
  return api.get<LoanItem[]>("/loans", { query: { status }, signal });
}

/* ------------------------------------------------------------------- advances */

export function requestAdvance(request: AdvanceRequestPayload): Promise<AdvanceItem> {
  return api.post<AdvanceItem>("/agent-advances/request", request);
}

export function getMyAdvances(signal?: AbortSignal): Promise<AdvanceItem[]> {
  return api.get<AdvanceItem[]>("/agent-advances/my-advances", { signal });
}

/** Company-wide, newest first. */
export function getAdvances(signal?: AbortSignal): Promise<AdvanceItem[]> {
  return api.get<AdvanceItem[]>("/agent-advances", { signal });
}

export function approveAdvance(id: number): Promise<AdvanceItem> {
  return api.put<AdvanceItem>(`/agent-advances/${id}/approve`);
}

export function rejectAdvance(id: number, reason: string): Promise<AdvanceItem> {
  return api.put<AdvanceItem>(`/agent-advances/${id}/reject`, { reason });
}

/* ----------------------------------------------------------- payment requests */

export function submitPaymentRequest(request: PaymentRequestPayload): Promise<PaymentRequestItem> {
  return api.post<PaymentRequestItem>("/payment-requests", request);
}

export function cancelPaymentRequest(id: number): Promise<PaymentRequestItem> {
  return api.put<PaymentRequestItem>(`/payment-requests/${id}/cancel`);
}

export function getMyPaymentRequests(signal?: AbortSignal): Promise<PaymentRequestItem[]> {
  return api.get<PaymentRequestItem[]>("/payment-requests/my", { signal });
}

/** Company-wide, newest first. `status` is optional. */
export function getPaymentRequests(status?: PaymentRequestStatus, signal?: AbortSignal): Promise<PaymentRequestItem[]> {
  return api.get<PaymentRequestItem[]>("/payment-requests", { query: { status }, signal });
}

export function approvePaymentRequest(id: number): Promise<PaymentRequestItem> {
  return api.put<PaymentRequestItem>(`/payment-requests/${id}/approve`);
}

export function rejectPaymentRequest(id: number, reason: string): Promise<PaymentRequestItem> {
  return api.put<PaymentRequestItem>(`/payment-requests/${id}/reject`, { reason });
}

/** Accounts Office: `reference` is how the money was sent (bank reference, M-Pesa code of the transfer...). */
export function releasePaymentRequest(id: number, reference: string): Promise<PaymentRequestItem> {
  return api.put<PaymentRequestItem>(`/payment-requests/${id}/release`, { reference });
}

/* ----------------------------------------------------------- employee payments */

export function recordEmployeePayment(request: EmployeePaymentPayload): Promise<EmployeePaymentItem> {
  return api.post<EmployeePaymentItem>("/employee-payments", request);
}

/** The agent's own payments, newest first. */
export function getMyEmployeePayments(
  paymentRequestId?: number,
  signal?: AbortSignal,
): Promise<EmployeePaymentItem[]> {
  return api.get<EmployeePaymentItem[]>("/employee-payments/my", { query: { paymentRequestId }, signal });
}