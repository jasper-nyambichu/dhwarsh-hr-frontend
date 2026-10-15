import type { PayslipResponse } from "@/types/payroll";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct" from an ISO date. */
export function monthLabel(isoDate: string): string {
  return MONTHS[Number(isoDate.slice(5, 7)) - 1] ?? "—";
}

/** The statutory amounts a set of payslips adds up to — what finance remits. */
export function statutoryTotals(payslips: readonly PayslipResponse[]) {
  const sum = (pick: (payslip: PayslipResponse) => number | null) =>
    payslips.reduce((total, payslip) => total + (pick(payslip) ?? 0), 0);

  const paye = sum((p) => p.payeDeduction);
  const nssf = sum((p) => p.nssfDeduction);
  const shif = sum((p) => p.shifDeduction);
  const housingLevy = sum((p) => p.housingLevyDeduction);

  return { paye, nssf, shif, housingLevy, total: paye + nssf + shif + housingLevy };
}