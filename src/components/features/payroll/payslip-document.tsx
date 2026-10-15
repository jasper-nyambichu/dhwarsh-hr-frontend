import Link from "next/link";

import { PrintButton } from "@/components/shared/print-button";
import { Icon } from "@/components/ui/icon";
import { formatDateRange, formatMoney, formatMonthYear } from "@/lib/format";
import type { PayslipResponse } from "@/types/payroll";

/**
 * The payslip as a printable document. Shared by the employee view (/me/payslips/[id])
 * and the payroll view (/payroll/payslips/[id]) so the two can never drift apart.
 *
 * Every figure is the backend's — nothing is recomputed here except the total of
 * the deduction lines for display. Gross already has unpaid leave taken out, and
 * NITA is an employer levy, so it is shown separately and is not part of the
 * deductions or of net pay.
 */

type Line = { label: string; amount: number | null };

function LineList({ lines }: { lines: Line[] }) {
  return (
    <div className="space-y-4">
      {lines.map((line) => (
        <div key={line.label} className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">{line.label}</span>
          <span className="font-medium text-on-surface">{formatMoney(line.amount)}</span>
        </div>
      ))}
    </div>
  );
}

export function PayslipDocument({
  payslip,
  backHref,
  backLabel,
}: {
  payslip: PayslipResponse;
  backHref: string;
  backLabel: string;
}) {
  const earnings: Line[] = [
    { label: "Basic Salary", amount: payslip.basicSalary },
    { label: "House Allowance", amount: payslip.houseAllowance },
    { label: "Transport Allowance", amount: payslip.transportAllowance },
    { label: "Overtime", amount: payslip.overtimePay },
    { label: "Bonus", amount: payslip.bonus },
    { label: "Other Allowances", amount: payslip.otherAllowances },
  ].filter((line) => line.label === "Basic Salary" || (line.amount ?? 0) > 0);

  if ((payslip.unpaidLeaveDeduction ?? 0) > 0) {
    earnings.push({ label: "Less: Unpaid Leave", amount: -(payslip.unpaidLeaveDeduction ?? 0) });
  }

  const deductions: Line[] = [
    { label: "PAYE", amount: payslip.payeDeduction },
    { label: "NSSF", amount: payslip.nssfDeduction },
    { label: "SHIF", amount: payslip.shifDeduction },
    { label: "Affordable Housing Levy", amount: payslip.housingLevyDeduction },
    { label: "Loan Repayment", amount: payslip.loanDeduction },
    { label: "Other Deductions", amount: payslip.otherDeductions },
  ].filter((line) => (line.amount ?? 0) > 0 || ["PAYE", "NSSF", "SHIF", "Affordable Housing Levy"].includes(line.label));

  const totalDeductions = payslip.grossPay - payslip.netPay;

  return (
    <div className="bg-surface-container-lowest/50 print:bg-white">
      <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between p-container-margin pb-0 print:hidden">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-container"
        >
          <Icon name="arrow_back" className="text-sm" />
          {backLabel}
        </Link>
        <PrintButton />
      </div>

      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-card bg-surface-container-lowest p-12 shadow-[0_2px_8px_rgba(11,42,69,.06)] print:shadow-none">
        <div className="mb-8 flex items-start justify-between border-b border-[#E9EFF5] pb-8">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-[#0B2A45]">Payslip</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Pay period: {formatDateRange(payslip.periodStart, payslip.periodEnd)}
            </p>
            <p className="text-sm text-on-surface-variant">Payroll run #{payslip.payrollRunId}</p>
          </div>
          <div className="text-right">
            <div className="inline-block rounded-md bg-primary-fixed px-3 py-1">
              <span className="text-sm font-bold uppercase tracking-wider text-on-primary-fixed">
                {formatMonthYear(payslip.periodEnd)}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-x-12 gap-y-6 rounded-xl border border-outline-variant/30 bg-surface-bright p-6">
          <div className="flex">
            <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">Employee</span>
            <span className="font-bold text-on-surface">{payslip.employeeName ?? "—"}</span>
          </div>
          <div className="flex">
            <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">Employee No</span>
            <span className="text-on-surface">{payslip.employeeNumber ?? "—"}</span>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-4 flex items-center gap-2 border-b border-[#E9EFF5] pb-2 text-sm font-bold uppercase tracking-wider text-on-surface">
              <Icon name="trending_up" className="text-lg text-tertiary-container" />
              Earnings
            </h3>
            <LineList lines={earnings} />
            <div className="mt-6 flex items-center justify-between border-t border-[#E9EFF5] pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Gross Pay</span>
              <span className="text-base font-bold text-tertiary-container">{formatMoney(payslip.grossPay)}</span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 border-b border-[#E9EFF5] pb-2 text-sm font-bold uppercase tracking-wider text-on-surface">
              <Icon name="trending_down" className="text-lg text-error" />
              Deductions
            </h3>
            <LineList lines={deductions} />
            <div className="mt-6 flex items-center justify-between border-t border-[#E9EFF5] pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Total Deductions</span>
              <span className="text-base font-bold text-error">{formatMoney(totalDeductions)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div>
            <h3 className="text-lg font-bold text-primary">Net Pay</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Amount paid to your bank account</p>
          </div>
          <div className="font-display-greeting text-3xl text-[#0B2A45]">{formatMoney(payslip.netPay)}</div>
        </div>

        {(payslip.nitaDeduction ?? 0) > 0 ? (
          <p className="mt-6 text-xs text-on-surface-variant">
            Employer levy (NITA {formatMoney(payslip.nitaDeduction)}) is paid by the employer and is not deducted from your pay.
          </p>
        ) : null}

        <div className="mt-12 text-center text-xs italic text-outline">
          This is a computer-generated document and does not require a signature unless explicitly requested for official purposes.
        </div>
      </div>

      <div className="h-12 print:hidden" />
    </div>
  );
}