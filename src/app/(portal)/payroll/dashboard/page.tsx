import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { getAllAdvances } from "@/lib/api/agent-advance";
import { getAllLoans } from "@/lib/api/loan";
import { getPayrollRuns, getRunPayslips } from "@/lib/api/payroll";
import { formatDateRange, formatMoney, formatMoneyCompact, formatNumber, initials } from "@/lib/format";
import { RUN_STATUS_CHIP, runScopeLabel } from "@/lib/payroll-format";
import { monthLabel, statutoryTotals } from "@/lib/payroll-stats";

/** Payroll Officer dashboard — live data from runs, payslips, loans and agent advances. */

async function load() {
  const [runs, pendingLoans, advances] = await Promise.all([
    getPayrollRuns(),
    getAllLoans("PENDING"),
    getAllAdvances(),
  ]);
  const latest = runs[0];
  const latestPayslips = latest ? await getRunPayslips(latest.id) : [];
  return { runs, pendingLoans, advances, latest, latestPayslips };
}

export default async function PayrollDashboardPage() {
  await requirePermission("payroll:read");

  let data: Awaited<ReturnType<typeof load>>;
  try {
    data = await load();
  } catch (error) {
    return (
      <DataUnavailable
        title="Dashboard"
        subject="Your payroll dashboard"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const { runs, pendingLoans, advances, latest, latestPayslips } = data;

  const outstandingAdvances = advances
    .filter((advance) => advance.status !== "FULLY_RECOVERED")
    .reduce((sum, advance) => sum + advance.outstandingBalance, 0);

  const trend: BarDatum[] = runs
    .slice(0, 6)
    .reverse()
    .map((run) => ({
      label: monthLabel(run.periodEnd),
      value: run.totalGrossPayroll ?? 0,
      tooltip: formatMoney(run.totalGrossPayroll),
    }));
  const trendMax = Math.max(1, ...trend.map((point) => point.value));

  const statutory = statutoryTotals(latestPayslips);
  const pct = (value: number) => (statutory.total > 0 ? Math.round((value / statutory.total) * 100) : 0);
  const deductionSplit = [
    { label: "PAYE", value: pct(statutory.paye), color: "var(--color-primary)" },
    { label: "NSSF", value: pct(statutory.nssf), color: "var(--color-primary-container)" },
    { label: "SHIF", value: pct(statutory.shif), color: "var(--color-secondary-fixed-dim)" },
    { label: "Housing Levy", value: pct(statutory.housingLevy), color: "var(--color-surface-variant)" },
  ];

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard
            label="Latest Run (Gross)"
            value={latest ? formatMoneyCompact(latest.totalGrossPayroll) : "—"}
            icon="payments"
            tone="primary"
            hint={latest ? formatDateRange(latest.periodStart, latest.periodEnd) : "No payroll run yet"}
          />
          <MetricCard
            label="Employees Paid"
            value={latest ? formatNumber(latest.payslipCount) : "—"}
            icon="group"
            tone="primary"
            hint={latest ? runScopeLabel(latest) : undefined}
          />
          <MetricCard
            label="Pending Loan Approvals"
            value={formatNumber(pendingLoans.length)}
            icon="pending_actions"
            tone="primary"
            hint={`${formatMoneyCompact(outstandingAdvances)} advances outstanding`}
          />
        </div>

        <BentoCard
          title="Payroll Cost Trend"
          subtitle="Gross payroll, last 6 runs"
          className="flex min-h-64 flex-col"
          bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2"
        >
          {trend.length === 0 ? (
            <EmptyState symbol="bar_chart" title="No payroll runs yet" description="Run payroll and the cost trend appears here." />
          ) : (
            <BarChart
              data={trend}
              max={trendMax}
              axisLabels={[formatMoneyCompact(trendMax, { showCurrency: false }), formatMoneyCompact(trendMax / 2, { showCurrency: false }), "0"]}
              tone="primary"
            />
          )}
        </BentoCard>

        <BentoCard
          title="Recent Runs"
          action={
            <Link href="/payroll/runs" className="text-[10px] font-semibold text-primary hover:underline">
              View All
            </Link>
          }
        >
          {runs.length === 0 ? (
            <EmptyState symbol="payments" title="No runs yet" />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Period</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Scope</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Staff</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Net (KES)</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {runs.slice(0, 5).map((run) => (
                    <tr key={run.id} className="border-b border-outline-variant/20 last:border-0">
                      <td className="py-3 pl-2 font-semibold text-primary">
                        <Link href={`/payroll/runs/${run.id}`}>{formatDateRange(run.periodStart, run.periodEnd)}</Link>
                      </td>
                      <td className="py-3 text-on-surface-variant">
                        <span className={`mr-2 inline-block size-2 rounded-full ${RUN_STATUS_CHIP[run.status].includes("error") ? "bg-error" : "bg-tertiary-container"}`} />
                        {runScopeLabel(run)}
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatNumber(run.payslipCount)}</td>
                      <td className="py-3 pr-2 text-right font-semibold tabular-nums">{formatMoney(run.totalNetPayroll, { showCurrency: false })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>

      <div className="flex flex-col gap-gutter lg:col-span-4">
        {pendingLoans.length > 0 ? (
          <AlertSpotlight
            eyebrow="Loan Approvals"
            title={`${pendingLoans.length} loan request${pendingLoans.length === 1 ? " is" : "s are"} awaiting approval`}
            message="Review each request and set its interest rate."
            cta="Review Now"
            href="/payroll/loans?status=PENDING"
          />
        ) : null}

        <BentoCard
          title="Pending Loans"
          action={
            <Link href="/payroll/loans" className="text-[10px] font-semibold text-primary hover:underline">
              View All
            </Link>
          }
        >
          {pendingLoans.length === 0 ? (
            <p className="py-2 text-sm text-on-surface-variant">No loan requests are waiting.</p>
          ) : (
            <div className="flex flex-col divide-y divide-outline-variant/20">
              {pendingLoans.slice(0, 4).map((loan) => (
                <Link key={loan.id} href={`/payroll/loans/${loan.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                  <span className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {initials(loan.employeeName)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-on-surface">{loan.employeeName ?? `Employee #${loan.employeeId}`}</span>
                      <span className="block text-xs text-on-surface-variant">Loan request</span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-on-surface">{formatMoney(loan.principalAmount, { showCurrency: false })}</span>
                </Link>
              ))}
            </div>
          )}
        </BentoCard>

        <BentoCard title="Statutory Split" subtitle={latest ? formatDateRange(latest.periodStart, latest.periodEnd) : undefined} bodyClassName="flex flex-col justify-center">
          {statutory.total > 0 ? (
            <DonutChart segments={deductionSplit} size={160} legend="value" centerLabel="Share %" />
          ) : (
            <EmptyState symbol="donut_large" title="No statutory data yet" />
          )}
        </BentoCard>
      </div>
    </div>
  );
}