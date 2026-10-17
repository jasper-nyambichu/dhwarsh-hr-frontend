import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AuditLogTable } from "@/components/features/audit/audit-log-table";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getAuditLogsForEntity } from "@/lib/api/audit";
import { getLoan, getLoanRepayments } from "@/lib/api/loan";
import { formatDate, formatMoney, humanizeEnum } from "@/lib/format";

/** One loan, audited: terms, every repayment, and who requested / approved it. */
export default async function AuditLoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("loan:read");

  const { id } = await params;
  const loanId = Number(id);
  if (!Number.isInteger(loanId) || loanId <= 0) notFound();

  let loan: Awaited<ReturnType<typeof getLoan>>;
  let repayments: Awaited<ReturnType<typeof getLoanRepayments>>;
  try {
    [loan, repayments] = await Promise.all([getLoan(loanId), getLoanRepayments(loanId)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return <DataUnavailable title="Loan" subject="This loan" reason={error instanceof Error ? error.message : undefined} />;
  }

  const trail = await getAuditLogsForEntity("Loan", loanId, 10).catch(() => null);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link href="/audit/loans" aria-label="Back to loans" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high">
              <Icon name="arrow_back" />
            </Link>
            {`Loan — ${loan.employeeName ?? `Employee #${loan.employeeId}`}`}
          </span>
        }
        description={`Loan #${loan.id} · ${humanizeEnum(loan.status)} · requested ${formatDate(loan.requestDate)}`}
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Principal" value={formatMoney(loan.principalAmount)} icon="savings" tone="primary" />
        <MetricCard label="Total Repayable" value={formatMoney(loan.totalRepayable)} icon="receipt_long" tone="primary" hint={loan.status === "PENDING" ? "Interest set on approval" : `${loan.interestRate ?? 0}% flat interest`} />
        <MetricCard label="Outstanding" value={formatMoney(loan.outstandingBalance)} icon="account_balance_wallet" tone="primary" />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <BentoCard title="Repayments">
          {repayments.length === 0 ? (
            <EmptyState symbol="payments" title="No repayments yet" />
          ) : (
            <table className="w-full border-collapse text-left font-body-md text-body-md">
              <thead>
                <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                  <th className="pb-3">Payroll Run</th>
                  <th className="pb-3">Recorded</th>
                  <th className="pb-3 text-right">Amount (KES)</th>
                </tr>
              </thead>
              <tbody>
                {repayments.map((repayment) => (
                  <tr key={repayment.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="py-3 font-semibold text-primary">
                      <Link href={`/audit/payroll/${repayment.payrollRunId}`}>Run #{repayment.payrollRunId}</Link>
                    </td>
                    <td className="py-3 text-on-surface-variant">{formatDate(repayment.paidOn)}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(repayment.amountPaid, { showCurrency: false })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </BentoCard>

        <BentoCard title="Audit trail">
          {!trail || trail.content.length === 0 ? (
            <p className="py-2 text-sm text-on-surface-variant">No audit entries are linked to this loan.</p>
          ) : (
            <AuditLogTable logs={trail.content} detailBasePath="/audit/logs" />
          )}
        </BentoCard>
      </div>
    </>
  );
}