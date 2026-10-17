import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getPayrollRuns } from "@/lib/api/payroll";
import { formatDateRange, formatMoney, formatMoneyCompact, formatNumber, humanizeEnum } from "@/lib/format";
import { RUN_STATUS_CHIP, runScopeLabel } from "@/lib/payroll-format";

/** Payroll for audit review — every run, read-only. Open one for its payslips, statutory totals and who ran it. */
export default async function AuditPayrollPage() {
  await requirePermission("payroll:read");

  let runs: Awaited<ReturnType<typeof getPayrollRuns>>;
  try {
    runs = await getPayrollRuns();
  } catch (error) {
    return (
      <DataUnavailable
        title="Payroll"
        subject="The payroll run list"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const totalGross = runs.reduce((sum, run) => sum + (run.totalGrossPayroll ?? 0), 0);
  const totalNet = runs.reduce((sum, run) => sum + (run.totalNetPayroll ?? 0), 0);

  return (
    <>
      <PageHeader title="Payroll" description="Every payroll run, for review. Nothing here can be changed." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Runs" value={formatNumber(runs.length)} icon="payments" tone="primary" />
        <MetricCard label="Total Gross (all runs)" value={formatMoneyCompact(totalGross)} icon="account_balance_wallet" tone="primary" />
        <MetricCard label="Total Net (all runs)" value={formatMoneyCompact(totalNet)} icon="payments" tone="primary" />
      </div>

      <BentoCard className="mt-gutter" title="Payroll Runs">
        {runs.length === 0 ? (
          <EmptyState symbol="payments" title="No payroll runs yet" />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Period</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Scope</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Employees</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Gross (KES)</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Net (KES)</th>
                  <th className="pb-3 pr-2 text-center font-table-header text-table-header uppercase text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface">
                    <td className="py-3 pl-2 font-semibold text-primary">
                      <Link href={`/audit/payroll/${run.id}`}>{formatDateRange(run.periodStart, run.periodEnd)}</Link>
                    </td>
                    <td className="py-3 text-on-surface-variant">{runScopeLabel(run)}</td>
                    <td className="py-3 text-right tabular-nums">{formatNumber(run.payslipCount)}</td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(run.totalGrossPayroll, { showCurrency: false })}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(run.totalNetPayroll, { showCurrency: false })}</td>
                    <td className="py-3 pr-2 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${RUN_STATUS_CHIP[run.status]}`}>
                        {humanizeEnum(run.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>
    </>
  );
}