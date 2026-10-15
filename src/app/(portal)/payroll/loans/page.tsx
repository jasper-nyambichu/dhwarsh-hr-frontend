import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { MetricCard } from "@/components/shared/metric-card";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getAllLoans } from "@/lib/api/loan";
import { formatDate, formatMoney, formatMoneyCompact, formatNumber, humanizeEnum, initials } from "@/lib/format";
import type { LoanResponse, LoanStatus } from "@/types/payroll";

/** Employee loans — every loan, filtered by `?status=`. Approval happens on the detail page. */

const STATUS_TABS: readonly FilterTab[] = [
  { label: "All Loans" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Closed", value: "CLOSED" },
];

const STATUSES: readonly LoanStatus[] = ["PENDING", "APPROVED", "REJECTED", "CLOSED"];

const STATUS_CHIP: Record<LoanStatus, string> = {
  PENDING: "bg-amber-main/10 text-amber-main border border-amber-main/30",
  APPROVED: "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30",
  REJECTED: "bg-error/10 text-error border border-error/30",
  CLOSED: "bg-surface-variant text-on-surface-variant border border-outline-variant/50",
};

export default async function PayrollLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("loan:read");
  const { status } = await searchParams;
  const activeStatus = STATUSES.find((value) => value === status);

  let loans: LoanResponse[];
  try {
    loans = await getAllLoans();
  } catch (error) {
    return (
      <DataUnavailable
        title="Employee Loans"
        subject="The loan list"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const pending = loans.filter((loan) => loan.status === "PENDING");
  const approved = loans.filter((loan) => loan.status === "APPROVED");
  const outstanding = approved.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  const rows = activeStatus ? loans.filter((loan) => loan.status === activeStatus) : loans;

  return (
    <>
      <PageHeader
        title="Employee Loans"
        description="Requests, approved loans and what is still owed."
        pill={pending.length > 0 ? <CountPill label={`${pending.length} Pending`} tone="warning" /> : undefined}
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Pending Approval" value={formatNumber(pending.length)} icon="pending_actions" tone="primary" />
        <MetricCard label="Active Loans" value={formatNumber(approved.length)} icon="savings" tone="primary" />
        <MetricCard label="Outstanding Balance" value={formatMoneyCompact(outstanding)} icon="account_balance_wallet" tone="primary" hint="Across active loans" />
      </div>

      <div className="mt-gutter flex flex-col gap-6">
        <FilterTabs tabs={STATUS_TABS} active={activeStatus} param="status" basePath="/payroll/loans" />

        <BentoCard title="Loans">
          {rows.length === 0 ? (
            <EmptyState symbol="savings" title="No loans found" description="Loans appear here once employees request them." />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Principal</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Interest</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Instalment</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Outstanding</th>
                    <th className="pb-3 text-center font-table-header text-table-header uppercase text-outline">Requested</th>
                    <th className="pb-3 pr-2 text-center font-table-header text-table-header uppercase text-outline">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {rows.map((loan) => (
                    <tr key={loan.id} className="group border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface">
                      <td className="py-3 pl-2">
                        <Link href={`/payroll/loans/${loan.id}`} className="flex items-center gap-3">
                          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {initials(loan.employeeName)}
                          </span>
                          <span className="font-semibold group-hover:text-primary">{loan.employeeName ?? `Employee #${loan.employeeId}`}</span>
                        </Link>
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(loan.principalAmount, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums text-on-surface-variant">
                        {loan.status === "PENDING" ? "Set on approval" : `${loan.interestRate ?? 0}%`}
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(loan.installmentAmount, { showCurrency: false })}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(loan.outstandingBalance, { showCurrency: false })}</td>
                      <td className="py-3 text-center text-on-surface-variant">{formatDate(loan.requestDate)}</td>
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
          <p className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
            <Icon name="info" className="text-[14px]" />
            Approved loans are deducted automatically in each payroll run until the balance reaches zero.
          </p>
        </BentoCard>
      </div>
    </>
  );
}