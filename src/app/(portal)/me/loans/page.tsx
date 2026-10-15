import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { hasPermission } from "@/config/roles";
import { getMyLoans } from "@/lib/api/loan";
import { formatDate, formatMoney, formatMoneyCompact, humanizeEnum } from "@/lib/format";
import type { LoanResponse, LoanStatus } from "@/types/payroll";

const STATUS_CHIP: Record<LoanStatus, string> = {
  PENDING: "bg-amber-main/10 text-amber-main border border-amber-main/30",
  APPROVED: "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30",
  REJECTED: "bg-error/10 text-error border border-error/30",
  CLOSED: "bg-surface-variant text-on-surface-variant border border-outline-variant/50",
};

/** The signed-in employee's own loans and what is still owed. */
export default async function EmployeeLoansPage() {
  const session = await requirePermission("loan:read:self");
  const canRequest = hasPermission(session.role, "loan:request");

  let loans: LoanResponse[];
  try {
    loans = await getMyLoans();
  } catch (error) {
    return (
      <DataUnavailable
        title="My Loans"
        subject="Your loans"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const active = loans.filter((loan) => loan.status === "APPROVED");
  const outstanding = active.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  const monthly = active.reduce((sum, loan) => sum + loan.installmentAmount, 0);
  const pending = loans.filter((loan) => loan.status === "PENDING").length;

  return (
    <>
      <PageHeader
        title="My Loans"
        description="Your loan requests and repayments."
        actions={
          canRequest ? (
            <Link
              href="/me/loans/new"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
            >
              <Icon name="add" className="text-[18px]" />
              Request Loan
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Outstanding Balance" value={formatMoneyCompact(outstanding)} icon="account_balance_wallet" tone="primary" />
        <MetricCard label="Monthly Deduction" value={formatMoneyCompact(monthly)} icon="payments" tone="primary" hint="Taken from your pay" />
        <MetricCard label="Awaiting Approval" value={String(pending)} icon="pending_actions" tone="primary" />
      </div>

      <BentoCard className="mt-gutter" title="Loan History">
        {loans.length === 0 ? (
          <EmptyState symbol="savings" title="No loans" description="You have not requested a loan." />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Requested</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Principal</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Total Repayable</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Monthly</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Outstanding</th>
                  <th className="pb-3 pr-2 text-center font-table-header text-table-header uppercase text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="whitespace-nowrap py-3 pl-2 text-on-surface-variant">{formatDate(loan.requestDate)}</td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(loan.principalAmount, { showCurrency: false })}</td>
                    <td className="py-3 text-right tabular-nums text-on-surface-variant">
                      {loan.status === "PENDING" ? "On approval" : formatMoney(loan.totalRepayable, { showCurrency: false })}
                    </td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(loan.installmentAmount, { showCurrency: false })}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(loan.outstandingBalance, { showCurrency: false })}</td>
                    <td className="py-3 pr-2 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CHIP[loan.status]}`}>
                        {humanizeEnum(loan.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 flex items-start gap-2 text-xs text-on-surface-variant">
          <Icon name="info" className="mt-0.5 text-[14px]" />
          Approved loans are deducted from your pay each month until the balance reaches zero.
        </p>
      </BentoCard>
    </>
  );
}