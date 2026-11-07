/**
 * `dto/response/settlement/PayslipResponse`.
 *
 * `amountDue` is what the payment formula gives the employee: pay + PAYE + NSSF + NITA - loans -
 * damages. `amountRecorded` is what the agent has recorded paying by M-Pesa against that period, and
 * `amountNotRecorded` is the difference left to account for.
 */
export type RecordedPayment = {
  mpesaCode: string;
  amount: number;
  paidOn: string;
};

/** One loan instalment or one damage taken off a payslip. `date` is the damage date; null for loans. */
export type DeductionItem = {
  id: number;
  label: string;
  date: string | null;
  amount: number;
};

export type EmployeePayslip = {
  id: number;
  settlementId: number;
  periodStart: string;
  periodEnd: string;
  employeeId: number;
  employeeNumber: string;
  employeeName: string;
  branchName: string | null;
  agentName: string | null;
  daysWorked: number;
  dailyRate: number;
  pay: number;
  paye: number;
  nssf: number;
  nita: number;
  loan: number;
  damage: number;
  amountDue: number;
  amountRecorded: number;
  amountNotRecorded: number;
  payments: RecordedPayment[];
  /** Itemise `loan` and `damage`. Empty on a payslip from a server without itemising. */
  loanItems?: DeductionItem[];
  damageItems?: DeductionItem[];
};
