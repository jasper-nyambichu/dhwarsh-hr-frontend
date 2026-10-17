import Link from "next/link";
import { format, parseISO, subDays } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AuditLogTable } from "@/components/features/audit/audit-log-table";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getAllAdvances } from "@/lib/api/agent-advance";
import { getAuditLogs, getAuditSummary } from "@/lib/api/audit";
import { getAllLoans } from "@/lib/api/loan";
import { getPayrollRuns } from "@/lib/api/payroll";
import { actionLabel } from "@/lib/audit-format";
import { formatDateRange, formatMoneyCompact, formatNumber } from "@/lib/format";
import { first } from "@/lib/search-params";

/**
 * Auditor dashboard. The activity half comes from the audit log; the financial half (latest
 * payroll, loans, agent advances) is a read-only snapshot. The financial reads are optional:
 * if one fails the rest of the dashboard still loads.
 */
export default async function AuditDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("audit:read");

  const params = await searchParams;
  const days = first(params.days) === "30" ? 30 : 7;
  const today = new Date();
  const from = format(subDays(today, days - 1), "yyyy-MM-dd");
  const to = format(today, "yyyy-MM-dd");

  let summary: Awaited<ReturnType<typeof getAuditSummary>>;
  let recent: Awaited<ReturnType<typeof getAuditLogs>>;
  try {
    [summary, recent] = await Promise.all([getAuditSummary({ from, to }), getAuditLogs({ size: 8 })]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Dashboard"
        subject="The audit summary"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const [runsResult, loansResult, advancesResult] = await Promise.allSettled([
    getPayrollRuns(),
    getAllLoans(),
    getAllAdvances(),
  ]);
  const runs = runsResult.status === "fulfilled" ? runsResult.value : [];
  const loans = loansResult.status === "fulfilled" ? loansResult.value : [];
  const advances = advancesResult.status === "fulfilled" ? advancesResult.value : [];

  const latestRun = runs[0];
  const pendingLoans = loans.filter((loan) => loan.status === "PENDING").length;
  const loanBalance = loans.filter((loan) => loan.status === "APPROVED").reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  const advanceBalance = advances.filter((advance) => advance.status !== "FULLY_RECOVERED").reduce((sum, advance) => sum + advance.outstandingBalance, 0);

  const daily: BarDatum[] = summary.daily.map((day) => ({
    label: format(parseISO(day.date), days === 7 ? "EEE" : "d"),
    value: day.count,
    tooltip: `${format(parseISO(day.date), "d MMM")}: ${formatNumber(day.count)} events`,
  }));
  const dailyMax = Math.max(1, ...daily.map((point) => point.value));
  const moduleMax = Math.max(1, ...summary.byEntityType.map((entry) => entry.count));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Activity ${formatDateRange(summary.from, summary.to)} — read-only.`}
        actions={
          <div className="flex gap-2">
            {[7, 30].map((option) => (
              <Link
                key={option}
                href={`/audit/dashboard?days=${option}`}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  days === option ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                Last {option} days
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        <MetricCard label="Audit Events" value={formatNumber(summary.totalEvents)} icon="policy" tone="primary" />
        <MetricCard
          label="Failed Sign-ins"
          value={formatNumber(summary.loginFailed)}
          icon="gpp_maybe"
          tone={summary.loginFailed > 0 ? "error" : "primary"}
          hint={`${formatNumber(summary.loginSuccess)} successful`}
        />
        <MetricCard label="Payroll Runs" value={formatNumber(summary.payrollRuns)} icon="payments" tone="primary" hint="Executed in this period" />
        <MetricCard label="Pending Loans" value={formatNumber(pendingLoans)} icon="pending_actions" tone="primary" hint="Awaiting approval" />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard
          label="Latest Payroll (Gross)"
          value={latestRun ? formatMoneyCompact(latestRun.totalGrossPayroll) : "—"}
          icon="account_balance_wallet"
          tone="primary"
          hint={latestRun ? formatDateRange(latestRun.periodStart, latestRun.periodEnd) : "No run yet"}
        />
        <MetricCard label="Loans Outstanding" value={formatMoneyCompact(loanBalance)} icon="savings" tone="primary" />
        <MetricCard label="Agent Advances Outstanding" value={formatMoneyCompact(advanceBalance)} icon="account_balance_wallet" tone="primary" />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <BentoCard title="Activity per Day" className="flex min-h-64 flex-col lg:col-span-2" bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2">
          <BarChart data={daily} max={dailyMax} axisLabels={[String(dailyMax), String(Math.round(dailyMax / 2)), "0"]} tone="primary" />
        </BentoCard>

        <BentoCard title="Most Active Users">
          {summary.topUsers.length === 0 ? (
            <p className="py-2 text-sm text-on-surface-variant">No user activity in this period.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-outline-variant/20">
              {summary.topUsers.map((user) => (
                <li key={user.userId} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/audit/logs?user=${user.userId}`} className="text-sm font-medium text-on-surface hover:text-primary">
                    {user.username ?? `User #${user.userId}`}
                  </Link>
                  <span className="text-sm tabular-nums text-on-surface-variant">{formatNumber(user.count)}</span>
                </li>
              ))}
            </ol>
          )}
        </BentoCard>
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <BentoCard title="Events by Record Type">
          {summary.byEntityType.length === 0 ? (
            <p className="py-2 text-sm text-on-surface-variant">Nothing recorded in this period.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {summary.byEntityType.slice(0, 8).map((entry) => (
                <Link key={entry.label} href={`/audit/logs?entityType=${encodeURIComponent(entry.label)}`} className="group block">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-on-surface group-hover:text-primary">{entry.label}</span>
                    <span className="tabular-nums text-on-surface-variant">{formatNumber(entry.count)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-container-high">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(4, (entry.count / moduleMax) * 100)}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </BentoCard>

        <BentoCard
          title="Recent Events"
          className="lg:col-span-2"
          action={<Link href="/audit/logs" className="text-[10px] font-semibold text-primary hover:underline">View All</Link>}
        >
          {recent.content.length === 0 ? (
            <EmptyState symbol="policy" title="No events yet" />
          ) : (
            <AuditLogTable logs={recent.content} detailBasePath="/audit/logs" />
          )}
        </BentoCard>
      </div>

      {summary.byAction.length > 0 ? (
        <p className="mt-gutter text-xs text-on-surface-variant">
          Most frequent action: {actionLabel(summary.byAction[0].label)} ({formatNumber(summary.byAction[0].count)}).
        </p>
      ) : null}
    </>
  );
}