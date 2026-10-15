import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { hasPermission } from "@/config/roles";
import { getLoan, getLoanRepayments } from "@/lib/api/loan";
import { formatDate, formatMoney, humanizeEnum } from "@/lib/format";

import { LoanDecision } from "./_components/loan-decision";

/** One loan: terms, repayments so far, and — while pending — the approve / reject decision. */
export default async function PayrollLoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("loan:read");

  const { id } = await params;
  const loanId = Number(id);
  if (!Number.isInteger(loanId) || loanId <= 0) notFound();

  const canSeeRepayments = hasPermission(session.role, "loan:repayment:read");
  const canDecide = hasPermission(session.role, "loan:approve");

  let data: {
    loan: Awaited<ReturnType<typeof getLoan>>;
    repayments: Awaited<ReturnType<typeof getLoanRepayments>>;
  };

  try {
    const [loan, repayments] = await Promise.all([
      getLoan(loanId),
      canSeeRepayments ? getLoanRepayments(loanId) : Promise.resolve([]),
    ]);
    data = { loan, repayments };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return (
      <DataUnavailable
        title="Loan"
        subject="This loan"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const { loan, repayments } = data;
  const interest = loan.totalRepayable - loan.principalAmount;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link href="/payroll/loans" aria-label="Back to loans" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high">
              <Icon name="arrow_back" />
            </Link>
            <span>
              <span className="block">{`Loan — ${loan.employeeName ?? `Employee #${loan.employeeId}`}`}</span>
              <span className="block font-body-md text-body-md font-medium text-on-surface-variant">
                Loan #{loan.id} · {humanizeEnum(loan.status)}
              </span>
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            <MetricCard label="Principal" value={formatMoney(loan.principalAmount)} icon="savings" tone="primary" />
            <MetricCard
              label="Total Repayable"
              value={formatMoney(loan.totalRepayable)}
              icon="receipt_long"
              tone="primary"
              hint={loan.status === "PENDING" ? "Interest set on approval" : `Includes ${formatMoney(interest)} interest`}
            />
            <MetricCard label="Outstanding" value={formatMoney(loan.outstandingBalance)} icon="account_balance_wallet" tone="primary" />
          </div>

          <BentoCard title="Repayments" subtitle="Instalments taken from payroll">
            {!canSeeRepayments ? (
              <p className="py-2 text-sm text-on-surface-variant">You do not have access to repayment history.</p>
            ) : repayments.length === 0 ? (
              <EmptyState symbol="payments" title="No repayments yet" description="Instalments appear here after each payroll run." />
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Payroll Run</th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Recorded</th>
                      <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Amount (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md text-on-surface">
                    {repayments.map((repayment) => (
                      <tr key={repayment.id} className="border-b border-outline-variant/20 last:border-0">
                        <td className="py-3 pl-2 font-semibold text-primary">
                          <Link href={`/payroll/runs/${repayment.payrollRunId}`}>Run #{repayment.payrollRunId}</Link>
                        </td>
                        <td className="py-3 text-on-surface-variant">{formatDate(repayment.paidOn)}</td>
                        <td className="py-3 pr-2 text-right font-semibold tabular-nums">{formatMoney(repayment.amountPaid, { showCurrency: false })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>

        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title="Terms">
            <div className="flex flex-col">
              {[
                ["Monthly instalment", formatMoney(loan.installmentAmount)],
                ["Interest (flat)", loan.status === "PENDING" ? "Set on approval" : `${loan.interestRate ?? 0}%`],
                ["Requested", formatDate(loan.requestDate)],
                ["Approved", formatDate(loan.approvalDate)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-outline-variant/20 py-2 last:border-0">
                  <span className="text-xs text-on-surface-variant">{label}</span>
                  <span className="text-right text-sm font-medium text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          </BentoCard>

          {loan.status === "PENDING" && canDecide ? <LoanDecision loanId={loan.id} /> : null}
        </div>
      </div>
    </>
  );
}