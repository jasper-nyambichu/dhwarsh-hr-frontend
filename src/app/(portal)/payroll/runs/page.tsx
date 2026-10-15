import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { hasPermission } from "@/config/roles";
import { getPayrollRuns } from "@/lib/api/payroll";
import { formatDateRange, formatMoney, formatMoneyCompact, formatNumber, humanizeEnum } from "@/lib/format";
import { RUN_STATUS_CHIP, runScopeLabel } from "@/lib/payroll-format";
import type { PayrollRunResponse } from "@/types/payroll";

/** Payroll runs — every run, newest period first, from `GET /payroll/runs`. */
export default async function PayrollRunsPage() {
  const session = await requirePermission("payroll:read");
  const canRun = hasPermission(session.role, "payroll:run");

  let runs: PayrollRunResponse[];
  try {
    runs = await getPayrollRuns();
  } catch (error) {
    return (
      <DataUnavailable
        title="Payroll Runs"
        subject="The payroll run list"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const latest = runs[0];

  return (
    <>
      <PageHeader
        title="Payroll Runs"
        description="Every payroll run, newest period first."
        actions={
          canRun ? (
            <Link
              href="/payroll/runs/new"
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md text-body-md font-medium text-on-primary shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Icon name="add" className="text-sm" />
              New Run
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Runs" value={formatNumber(runs.length)} icon="payments" tone="primary" />
        <MetricCard
          label="Latest Gross"
          value={latest ? formatMoneyCompact(latest.totalGrossPayroll) : "—"}
          icon="account_balance_wallet"
          tone="primary"
          hint={latest ? formatDateRange(latest.periodStart, latest.periodEnd) : "No runs yet"}
        />
        <MetricCard
          label="Latest Net"
          value={latest ? formatMoneyCompact(latest.totalNetPayroll) : "—"}
          icon="payments"
          tone="primary"
          hint={latest ? runScopeLabel(latest) : undefined}
        />
      </div>

      <BentoCard className="mt-gutter" title="All Runs">
        {runs.length === 0 ? (
          <EmptyState
            symbol="payments"
            title="No payroll runs yet"
            description="Run payroll for a period and it will appear here."
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Period</th>
                  <th className="pb-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Scope</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Employees</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Gross (KES)</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Net (KES)</th>
                  <th className="pb-3 text-center font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface">
                    <td className="py-4 pl-2 font-semibold text-primary">
                      <Link href={`/payroll/runs/${run.id}`}>{formatDateRange(run.periodStart, run.periodEnd)}</Link>
                    </td>
                    <td className="py-4 text-on-surface-variant">{runScopeLabel(run)}</td>
                    <td className="py-4 text-right tabular-nums">{formatNumber(run.payslipCount)}</td>
                    <td className="py-4 text-right tabular-nums">{formatMoney(run.totalGrossPayroll, { showCurrency: false })}</td>
                    <td className="py-4 text-right font-semibold tabular-nums">{formatMoney(run.totalNetPayroll, { showCurrency: false })}</td>
                    <td className="py-4 text-center">
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