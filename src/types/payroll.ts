/**
 * Payroll types. Mirrors `dto/response/payroll/*`, `dto/request/payroll/PayrollRunRequest`
 * and `dto/response/loan/*`.
 *
 * Kept out of `types/index.ts` on purpose: its `PayrollRunStatus` lists DRAFT /
 * PROCESSING / APPROVED / CANCELLED, none of which the backend writes. A run is
 * calculated synchronously and ends COMPLETED (or the whole transaction rolls back).
 */

export const PAYROLL_RUN_STATES = ["IN_PROGRESS", "COMPLETED", "FAILED"] as const;
export type PayrollRunState = (typeof PAYROLL_RUN_STATES)[number];

export type PayrollRunResponse = {
  id: number;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunState;
  totalGrossPayroll: number | null;
  totalNetPayroll: number | null;
  payslipCount: number;
  agentCount: number;
  /** Comma-separated ids; all three null means every active employee. */
  scopeBranchIds: string | null;
  scopeAgentIds: string | null;
  scopeDepartmentIds: string | null;
};

export type PayrollRunRequest = {
  periodStart: string;
  periodEnd: string;
  allEmployees: boolean;
  branchIds: number[];
  agentIds: number[];
  departmentIds: number[];
};

export type PayslipResponse = {
  id: number;
  payrollRunId: number;
  periodStart: string;
  periodEnd: string;
  employeeId: number;
  employeeName: string | null;
  employeeNumber: string | null;
    /** Whole days worked in this pay period. 0 on payslips made before the days × rate model. */
  daysWorked: number;
  /** The daily rate in force for the run (KES per day). */
  dailyRate: number | null;
  /** Days worked × daily rate. */
  basicSalary: number;
  houseAllowance: number | null;
  transportAllowance: number | null;
  overtimePay: number | null;
  bonus: number | null;
  otherAllowances: number | null;
  /** Retired: an unworked day is simply not paid. Only older payslips carry a value. */
  unpaidLeaveDeduction: number | null;
  grossPay: number;
  /** SHIF and NSSF are set by the Admin and ADDED to pay; they are not taken out of netPay. */
  shifDeduction: number | null;
  nssfDeduction: number | null;
  housingLevyDeduction: number | null;
  payeDeduction: number | null;
  /** Employer-borne levy: recorded for remittance, NOT deducted from netPay. */
  nitaDeduction: number | null;
  loanDeduction: number | null;
  /** Approved damages deducted in this run. */
  damageDeduction: number | null;
  otherDeductions: number | null;
  /** grossPay + SHIF + NSSF. */
  totalEmployeeSalary: number | null;
  netPay: number;
};

export type LoanStatus = "PENDING" | "APPROVED" | "REJECTED" | "CLOSED";

export type LoanResponse = {
  id: number;
  employeeId: number;
  employeeName: string | null;
  principalAmount: number;
  interestRate: number | null;
  /** principal + flat interest */
  totalRepayable: number;
  installmentAmount: number;
  outstandingBalance: number;
  requestDate: string | null;
  approvalDate: string | null;
  status: LoanStatus;
};

export type LoanRepaymentResponse = {
  id: number;
  loanId: number;
  payrollRunId: number;
  amountPaid: number;
  paidOn: string | null;
};