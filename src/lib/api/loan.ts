import "server-only";

import { api } from "@/app/lib/api-client";
import type { LoanRepaymentResponse, LoanResponse, LoanStatus } from "@/types/payroll";

/**
 * `controller/loan/LoanController` — base `/loans`.
 *
 * An employee requests a loan (principal + the instalment they can afford); they never
 * set the interest. The Payroll Officer fixes a flat interest rate when approving, and
 * the instalments are then deducted automatically in each payroll run.
 */

/** Company-wide list, newest first; `status` is optional. */
export function getAllLoans(status?: LoanStatus, signal?: AbortSignal): Promise<LoanResponse[]> {
  const query = status ? `?status=${status}` : "";
  return api.get<LoanResponse[]>(`/loans${query}`, { signal });
}

export function getLoan(id: number, signal?: AbortSignal): Promise<LoanResponse> {
  return api.get<LoanResponse>(`/loans/${id}`, { signal });
}

export function getLoanRepayments(id: number, signal?: AbortSignal): Promise<LoanRepaymentResponse[]> {
  return api.get<LoanRepaymentResponse[]>(`/loans/${id}/repayments`, { signal });
}

/** The signed-in employee's own loans, newest first. EMPLOYEE principal only. */
export function getMyLoans(signal?: AbortSignal): Promise<LoanResponse[]> {
  return api.get<LoanResponse[]>("/loans/my-loans", { signal });
}

export function requestMyLoan(request: {
  employeeId: number;
  principalAmount: number;
  installmentAmount: number;
}): Promise<LoanResponse> {
  return api.post<LoanResponse>("/loans/request", request);
}

/** `interestRate` is the flat percentage of principal; omit to leave the loan's rate as is. */
export function approveLoan(id: number, interestRate?: number): Promise<LoanResponse> {
  return api.put<LoanResponse>(
    `/loans/${id}/approve`,
    interestRate === undefined ? undefined : { interestRate },
  );
}

export function rejectLoan(id: number): Promise<LoanResponse> {
  return api.put<LoanResponse>(`/loans/${id}/reject`);
}