import type { EmployeePayslip } from "@/types/payslip";

/**
 * What the Admin's calculation says each employee gets, for one pay period. Every amount is the Admin's own
 * figure from the payslip, only ever added up here: nothing is worked out a second time on the agent's side,
 * so the two portals cannot disagree.
 */

export type PayPeriod = { key: string; start: string; end: string };

function keyOf(payslip: EmployeePayslip): string {
  return `${payslip.periodStart}_${payslip.periodEnd}`;
}

/** Every period that has payslips, newest first. */
export function payPeriods(payslips: EmployeePayslip[]): PayPeriod[] {
  const periods = new Map<string, PayPeriod>();
  for (const payslip of payslips) {
    periods.set(keyOf(payslip), { key: keyOf(payslip), start: payslip.periodStart, end: payslip.periodEnd });
  }
  return [...periods.values()].sort((a, b) => b.end.localeCompare(a.end) || b.start.localeCompare(a.start));
}

/** The period asked for in the URL, or the newest. */
export function choosePeriod(periods: PayPeriod[], requested: string | undefined): PayPeriod | null {
  return periods.find((period) => period.key === requested) ?? periods[0] ?? null;
}

export function inPeriod(payslips: EmployeePayslip[], period: PayPeriod | null): EmployeePayslip[] {
  return period ? payslips.filter((payslip) => keyOf(payslip) === period.key) : [];
}

export type PayTotals = { earnings: number; deductions: number; amountDue: number; recorded: number; notRecorded: number };

/** Pay plus the PAYE, NSSF and NITA the formula adds to it. */
export function earningsOf(payslip: EmployeePayslip): number {
  return payslip.pay + payslip.paye + payslip.nssf + payslip.nita;
}

export function payTotals(payslips: EmployeePayslip[]): PayTotals {
  return payslips.reduce<PayTotals>(
    (sum, payslip) => ({
      earnings: sum.earnings + earningsOf(payslip),
      deductions: sum.deductions + payslip.loan + payslip.damage,
      amountDue: sum.amountDue + payslip.amountDue,
      recorded: sum.recorded + payslip.amountRecorded,
      notRecorded: sum.notRecorded + payslip.amountNotRecorded,
    }),
    { earnings: 0, deductions: 0, amountDue: 0, recorded: 0, notRecorded: 0 },
  );
}
