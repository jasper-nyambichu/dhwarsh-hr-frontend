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
};
