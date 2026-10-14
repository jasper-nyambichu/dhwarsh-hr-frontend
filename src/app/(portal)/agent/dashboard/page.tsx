import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { getMyAgent } from "@/lib/api/agent";
import { getMyAdvances } from "@/lib/api/agent-advance";
import { getMyAgentSummaries } from "@/lib/api/agent-payroll";
import { chargeSummary } from "@/lib/agent-format";
import {
  formatDate,
  formatDateRange,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
} from "@/lib/format";

/**
 * Agent dashboard — live data from `/agents/me`, `/agent-advances/my-advances`
 * and `/payroll/my-agent-summaries`.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function load() {
  const [agent, advances, summaries] = await Promise.all([
    getMyAgent(),
    getMyAdvances(),
    getMyAgentSummaries(),
  ]);
  return { agent, advances, summaries };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 py-2 last:border-0">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-right text-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}

export default async function AgentDashboardPage() {
  await requirePermission("agent:read:self");

  let data: Awaited<ReturnType<typeof load>>;
  try {
    data = await load();
  } catch (error) {
    return (
      <DataUnavailable
        title="Dashboard"
        subject="Your dashboard"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const { agent, advances, summaries } = data;

  const latest = summaries[0];
  const openAdvances = advances.filter((a) => a.status !== "FULLY_RECOVERED");
  const outstanding = openAdvances.reduce((sum, a) => sum + a.outstandingBalance, 0);

  const trend: BarDatum[] = summaries
    .slice(0, 6)
    .reverse()
    .map((s) => ({
      label: MONTHS[Number(s.periodEnd.slice(5, 7)) - 1] ?? "—",
      value: s.finalAmountPayable,
      tooltip: formatMoney(s.finalAmountPayable),
    }));
  const trendMax = Math.max(1, ...trend.map((point) => point.value));

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard label="Deployed Staff" value={formatNumber(agent.employeeCount)} icon="group" tone="primary" />
          <MetricCard
            label="Latest Amount Payable"
            value={latest ? formatMoneyCompact(latest.finalAmountPayable) : "—"}
            icon="receipt_long"
            tone="primary"
            hint={latest ? formatDateRange(latest.periodStart, latest.periodEnd) : "No payroll run yet"}
          />
          <MetricCard
            label="Outstanding Advances"
            value={formatMoneyCompact(outstanding)}
            icon="payments"
            tone="primary"
            hint={`${openAdvances.length} open`}
          />
        </div>

        <BentoCard title="Amount Payable Trend" subtitle="Last 6 payroll runs" className="flex min-h-64 flex-col" bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2">
          {trend.length === 0 ? (
            <EmptyState symbol="bar_chart" title="No payroll runs yet" description="Your statements appear here after the first payroll run that includes your staff." />
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
          title="Recent Statements"
          action={
            <Link href="/agent/summaries" className="text-[10px] text-primary-container hover:underline">
              View All
            </Link>
          }
        >
          {summaries.length === 0 ? (
            <EmptyState symbol="description" title="No statements yet" />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Period</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Staff</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Before VAT</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Payable</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {summaries.slice(0, 5).map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 pl-2 font-medium text-primary">
                        <Link href={`/agent/summaries/${s.payrollRunId}`}>{formatDateRange(s.periodStart, s.periodEnd)}</Link>
                      </td>
                      <td className="py-3 tabular-nums text-on-surface-variant">{formatNumber(s.employeeCount)}</td>
                      <td className="py-3 text-right tabular-nums text-on-surface-variant">{formatMoney(s.subtotalBeforeVat, { showCurrency: false })}</td>
                      <td className="py-3 pr-2 text-right font-semibold tabular-nums text-on-surface">{formatMoney(s.finalAmountPayable, { showCurrency: false })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>

      <div className="flex flex-col gap-gutter lg:col-span-4">
        {outstanding > 0 ? (
          <AlertSpotlight
            eyebrow="Advance Balance"
            title={`${formatMoney(outstanding)} outstanding`}
            message="Outstanding advances are deducted automatically from your next payment, before VAT."
            cta="View Advances"
            href="/agent/advances"
          />
        ) : null}

        <BentoCard title="Contract Terms">
          <div className="flex flex-col">
            <Row label="Service charge" value={chargeSummary(agent)} />
            <Row label="VAT registered" value={agent.vatRegistered ? "Yes" : "No"} />
            <Row label="KRA PIN" value={agent.kraPin ?? "—"} />
            <Row label="Contract start" value={formatDate(agent.contractStartDate)} />
            <Row label="Contract end" value={formatDate(agent.contractEndDate)} />
          </div>
          <Link
            href="/agent/staff"
            className="mt-4 block rounded-lg border border-outline-variant py-2 text-center font-body-md text-body-md font-medium text-primary transition-colors hover:bg-surface-container-low"
          >
            View Deployed Staff
          </Link>
        </BentoCard>
      </div>
    </div>
  );
}