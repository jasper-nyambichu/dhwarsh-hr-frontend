import "server-only";

import { api } from "@/app/lib/api-client";
import type { EmployeePayslip } from "@/types/payslip";

/**
 * `controller/settlement/PayslipController` — base `/payslips`.
 *
 * Admin reads every payslip, a Branch Manager those of their own branch, an Agent those of the
 * employees they were paid for. PDFs are served by `app/api/payslips/[id]/route.ts`.
 */

export function getPayslips(signal?: AbortSignal): Promise<EmployeePayslip[]> {
  return api.get<EmployeePayslip[]>("/payslips", { signal });
}

export function getMyBranchPayslips(signal?: AbortSignal): Promise<EmployeePayslip[]> {
  return api.get<EmployeePayslip[]>("/payslips/my-branch", { signal });
}

export function getMyAgentPayslips(signal?: AbortSignal): Promise<EmployeePayslip[]> {
  return api.get<EmployeePayslip[]>("/payslips/mine", { signal });
}

export function getPayslip(id: number, signal?: AbortSignal): Promise<EmployeePayslip> {
  return api.get<EmployeePayslip>(`/payslips/${id}`, { signal });
}
