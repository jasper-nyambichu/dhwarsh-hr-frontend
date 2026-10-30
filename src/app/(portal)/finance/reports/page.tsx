import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getFinanceRuns } from "@/lib/api/finance";
import { directStatutory, runPeriod } from "@/lib/finance-format";
import { formatKes } from "@/lib/money-format";

/** Cash out over recent runs, plus the payroll register PDF for each run. */
export default async function FinanceReportsPage() {
  await requirePermission("report:read");

  let runs: Awaited<ReturnType<typeof getFinanceRuns>>;
  try {
    runs = await getFinanceRuns();
  } catch (error) {
    return (
      <DataUnavailable
        title="Reports"
        subject="The finance figures"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const recent = runs.slice(0, 6).reverse(); // oldest first, so the chart reads left to right
  const peak = Math.max(...recent.map((run) => run.totalCashRequirement), 1);
  const latest = runs[0];
  const allTime = runs.reduce((sum, run) => sum + run.totalCashRequirement, 0);
  const statutoryAll = runs.reduce((sum, run) => sum + directStatutory(run), 0);

  return (
    <>
      <PageHeader title="Reports" description="Cash out by payroll run, and the payroll register for each run." />

      {!latest ? (
        <EmptyState symbol="insert_chart" title="No payroll runs yet" description="Reports appear once Payroll runs a period." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            <MetricCard label="Latest run: cash needed" value={formatKes(latest.totalCashRequirement)} icon="payments" tone="primary" hint={runPeriod(latest)} />
            <MetricCard label="Cash needed, all runs" value={formatKes(allTime)} icon="account_balance_wallet" tone="primary" />
            <MetricCard label="Statutory remitted, all runs" value={formatKes(statutoryAll)} icon="gavel" tone="tertiary" />
          </div>

          <BentoCard className="mt-gutter" title="Cash needed per run" subtitle="The last six runs, oldest first">
            <ul className="flex flex-col gap-3">
              {recent.map((run) => (
                <li key={run.runId}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                    <span className="text-on-surface-variant">{runPeriod(run)}</span>
                    <span className="font-semibold tabular-nums text-on-surface">{formatKes(run.totalCashRequirement)}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded bg-surface-container-low">
                    <div
                      className="h-full rounded bg-primary"
                      style={{ width: `${Math.max(2, (run.totalCashRequirement / peak) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </BentoCard>

          <BentoCard className="mt-gutter" title="Payroll register" subtitle="One PDF per run, opens in a new tab">
            <ul className="flex flex-col gap-2">
              {runs.map((run) => (
                <li key={run.runId}>
                  <a
                    href={`/api/reports/payroll-register?runId=${run.runId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-outline-variant px-3 text-sm hover:bg-surface-container-low"
                  >
                    <span className="font-semibold text-on-surface">{runPeriod(run)}</span>
                    <span className="font-semibold text-primary">Open register (PDF)</span>
                  </a>
                </li>
              ))}
            </ul>
          </BentoCard>
        </>
      )}
    </>
  );
}