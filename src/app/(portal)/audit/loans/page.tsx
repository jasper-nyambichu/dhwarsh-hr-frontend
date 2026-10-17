import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getAllLoans } from "@/lib/api/loan";
import { formatDate, formatMoney, formatMoneyCompact, formatNumber, humanizeEnum } from "@/lib/format";
import type { LoanStatus } from "@/types/payroll";

const TABS: readonly FilterTab[] = [
  { label: "All Loans" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Closed", value: "CLOSED" },
];
const STATUSES: readonly LoanStatus[] = ["PENDING", "APPROVED", "REJECTED", "CLOSED"];

/** Employee loans for audit review — read-only. */
export default async function AuditLoansPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePermission("loan:read");
  const { status } = await searchParams;
  const active = STATUSES.find((value) => value === status);

  let loans: Awaited<ReturnType<typeof getAllLoans>>;
  try {
    loans = await getAllLoans();
  } catch (error) {
    return <DataUnavailable title="Loans" subject="The loan list" reason={error instanceof Error ? error.message : undefined} />;
  }

  const rows = active ? loans.filter((loan) => loan.status === active) : loans;
  const approved = loans.filter((loan) => loan.status === "APPROVED");

  return (
    <>
      <PageHeader title="Loans" description="Every employee loan and what is still owed. Read-only." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Pending Approval" value={formatNumber(loans.filter((loan) => loan.status === "PENDING").length)} icon="pending_actions" tone="primary" />
        <MetricCard label="Active Loans" value={formatNumber(approved.length)} icon="savings" tone="primary" />
        <MetricCard label="Outstanding" value={formatMoneyCompact(approved.reduce((sum, loan) => sum + loan.outstandingBalance, 0))} icon="account_balance_wallet" tone="primary" />
      </div>

      <div className="mt-gutter flex flex-col gap-6">
        <FilterTabs tabs={TABS} active={active} param="status" basePath="/audit/loans" />
        <BentoCard title="Loans">
          {rows.length === 0 ? (
            <EmptyState symbol="savings" title="No loans found" />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full min-w-[760px] border-collapse text-left">
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
                    <tr key={loan.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface">
                      <td className="py-3 pl-2 font-semibold text-primary">
                        <Link href={`/audit/loans/${loan.id}`}>{loan.employeeName ?? `Employee #${loan.employeeId}`}</Link>
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(loan.principalAmount, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums text-on-surface-variant">{loan.status === "PENDING" ? "On approval" : `${loan.interestRate ?? 0}%`}</td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(loan.installmentAmount, { showCurrency: false })}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(loan.outstandingBalance, { showCurrency: false })}</td>
                      <td className="py-3 text-center text-on-surface-variant">{formatDate(loan.requestDate)}</td>
                      <td className="py-3 pr-2 text-center text-xs font-medium">{humanizeEnum(loan.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>
    </>
  );
}