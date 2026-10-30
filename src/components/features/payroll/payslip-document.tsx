import Link from "next/link";

import { PrintButton } from "@/components/shared/print-button";
import { Icon } from "@/components/ui/icon";
import { formatDateRange, formatMoney, formatMonthYear } from "@/lib/format";
import type { PayslipResponse } from "@/types/payroll";

/**
 * The payslip as a printable document. Shared by the employee view (/me/payslips/[id])
 * and the payroll view (/payroll/payslips/[id]) so the two can never drift apart.
 *
 * Every figure is the backend's. The pay model is: days worked × daily rate, with SHIF and NSSF
 * (set by the Admin) ADDED to give the total employee salary. Loan instalments and approved
 * damages are then deducted. SHIF and NSSF are therefore shown as additions, not deductions,
 * and NITA is an employer levy that is never part of the employee's pay.
 */

type Line = { label: string; amount: number | null };

function LineList({ lines, empty }: { lines: Line[]; empty?: string }) {
  if (lines.length === 0) {
    return <p className="text-sm text-on-surface-variant">{empty ?? "None"}</p>;
  }
  return (
    <div className="space-y-4">
      {lines.map((line) => (
        <div key={line.label} className="flex items-center justify-between gap-4 text-sm">
          <span className="text-on-surface-variant">{line.label}</span>
          <span className="shrink-0 font-medium text-on-surface">{formatMoney(line.amount)}</span>
        </div>
      ))}
    </div>
  );
}

const positive = (line: Line) => (line.amount ?? 0) > 0;

export function PayslipDocument({
  payslip,
  backHref,
  backLabel,
}: {
  payslip: PayslipResponse;
  backHref: string;
  backLabel: string;
}) {
  const payLabel =
    payslip.daysWorked > 0 && payslip.dailyRate
      ? `Pay for ${payslip.daysWorked} ${payslip.daysWorked === 1 ? "day" : "days"} × ${formatMoney(payslip.dailyRate)}`
      : "Basic pay";

  const earnings: Line[] = [
    { label: payLabel, amount: payslip.basicSalary },
    ...[
      { label: "House Allowance", amount: payslip.houseAllowance },
      { label: "Transport Allowance", amount: payslip.transportAllowance },
      { label: "Overtime", amount: payslip.overtimePay },
      { label: "Bonus", amount: payslip.bonus },
      { label: "Other Allowances", amount: payslip.otherAllowances },
    ].filter(positive),
  ];

  if ((payslip.unpaidLeaveDeduction ?? 0) > 0) {
    earnings.push({ label: "Less: Unpaid Leave", amount: -(payslip.unpaidLeaveDeduction ?? 0) });
  }

  const additions: Line[] = [
    { label: "SHIF", amount: payslip.shifDeduction },
    { label: "NSSF", amount: payslip.nssfDeduction },
  ].filter(positive);

  const deductions: Line[] = [
    { label: "PAYE", amount: payslip.payeDeduction },
    { label: "Affordable Housing Levy", amount: payslip.housingLevyDeduction },
    { label: "Loan Repayment", amount: payslip.loanDeduction },
    { label: "Damages", amount: payslip.damageDeduction },
    { label: "Other Deductions", amount: payslip.otherDeductions },
  ].filter(positive);

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

      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-card bg-surface-container-lowest p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] sm:p-12 print:shadow-none">
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

        <div className="mb-10 grid grid-cols-1 gap-x-12 gap-y-4 rounded-xl border border-outline-variant/30 bg-surface-bright p-6 sm:grid-cols-2 sm:gap-y-6">
          <div className="flex">
            <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">Employee</span>
            <span className="font-bold text-on-surface">{payslip.employeeName ?? "—"}</span>
          </div>
          <div className="flex">
            <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">Employee No</span>
            <span className="text-on-surface">{payslip.employeeNumber ?? "—"}</span>
          </div>
          {payslip.daysWorked > 0 ? (
            <div className="flex">
              <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">Days worked</span>
              <span className="text-on-surface">{payslip.daysWorked}</span>
            </div>
          ) : null}
          {payslip.dailyRate ? (
            <div className="flex">
              <span className="w-32 text-xs font-medium uppercase tracking-wider text-on-surface-variant">Daily rate</span>
              <span className="text-on-surface">{formatMoney(payslip.dailyRate)}</span>
            </div>
          ) : null}
        </div>

        <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
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

            {additions.length > 0 ? (
              <>
                <h4 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Added to pay
                </h4>
                <LineList lines={additions} />
                <div className="mt-4 flex items-center justify-between border-t border-[#E9EFF5] pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Total Employee Salary
                  </span>
                  <span className="text-base font-bold text-on-surface">
                    {formatMoney(payslip.totalEmployeeSalary ?? payslip.grossPay)}
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 border-b border-[#E9EFF5] pb-2 text-sm font-bold uppercase tracking-wider text-on-surface">
              <Icon name="trending_down" className="text-lg text-error" />
              Deductions
            </h3>
            <LineList lines={deductions} empty="No deductions this period" />
            <div className="mt-6 flex items-center justify-between border-t border-[#E9EFF5] pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Total Deductions</span>
              <span className="text-base font-bold text-error">{formatMoney(totalDeductions)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div>
            <h3 className="text-lg font-bold text-primary">Net Pay</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Gross pay less the deductions above</p>
          </div>
          <div className="font-display-greeting text-3xl text-[#0B2A45]">{formatMoney(payslip.netPay)}</div>
        </div>

        {(payslip.nitaDeduction ?? 0) > 0 ? (
          <p className="mt-6 text-xs text-on-surface-variant">
            Employer levy (NITA {formatMoney(payslip.nitaDeduction)}) is paid by the employer and is not deducted from pay.
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