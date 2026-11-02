import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { QuickAccess, type QuickAccessItem } from "@/components/features/dashboard/quick-access";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { navigationFor } from "@/config/navigation";
import { chargeSummary, settlementSubtotal } from "@/lib/agent-format";
import { getMyAgent } from "@/lib/api/agent";
import { getAgentLoans, getMyAdvances, getMyPaymentRequests } from "@/lib/api/agent-money";
import { getMyAgentAttendanceToday } from "@/lib/api/attendance";
import { getBranches } from "@/lib/api/branch";
import { getMyAgentPayments } from "@/lib/api/settlement";
import { getMyStaffRequests } from "@/lib/api/staff";
import {
  formatDate,
  formatDateRange,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
} from "@/lib/format";

/**
 * Agent dashboard. The headline figures come first, then a card for everywhere the agent can go, then
 * the payment trend and statements. The profile and payments are required; the other figures are
 * optional, and one that cannot be read shows as a dash rather than blanking the page.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CARD_LINK = "flex rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function value<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

function Row({ label, value: text }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 py-2 last:border-0">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-right text-sm font-medium text-on-surface">{text}</span>
    </div>
  );
}

export default async function AgentDashboardPage() {
  const session = await requirePermission("agent:read:self");

  let core: {
    agent: Awaited<ReturnType<typeof getMyAgent>>;
    summaries: Awaited<ReturnType<typeof getMyAgentPayments>>;
  };
  try {
    const [agent, summaries] = await Promise.all([getMyAgent(), getMyAgentPayments()]);
    core = { agent, summaries };
  } catch (error) {
    return (
      <DataUnavailable
        title="Dashboard"
        subject="Your dashboard"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const [advancesResult, staffRequestsResult, paymentRequestsResult, loansResult, todayResult, branchesResult] = await Promise.allSettled([
    getMyAdvances(),
    getMyStaffRequests(),
    getMyPaymentRequests(),
    getAgentLoans(),
    getMyAgentAttendanceToday(),
    getBranches(),
  ]);

  const { agent, summaries } = core;
  const advances = value(advancesResult);
  const staffRequests = value(staffRequestsResult);
  const paymentRequests = value(paymentRequestsResult);
  const loans = value(loansResult);
  const today = value(todayResult);
  const branches = value(branchesResult);

  const latest = summaries[0];

  // Only money actually given counts: a pending request has not been paid out yet.
  const openAdvances = (advances ?? []).filter((a) => a.status === "OUTSTANDING" || a.status === "PARTIALLY_RECOVERED");
  const outstanding = openAdvances.reduce((sum, a) => sum + a.outstandingBalance, 0);

  const pendingStaff = (staffRequests ?? []).filter((r) => r.status === "PENDING").length;
  const pendingMoney = (paymentRequests ?? []).filter((r) => r.status === "PENDING").length;
  const pendingAdvances = (advances ?? []).filter((a) => a.status === "PENDING").length;
  const pendingLoans = (loans ?? []).filter((l) => l.status === "PENDING").length;
  const awaiting = pendingStaff + pendingMoney + pendingAdvances + pendingLoans;
  const toRecord = (paymentRequests ?? []).filter((r) => r.status === "RELEASED" && r.remaining > 0).length;

  const hints: Record<string, Pick<QuickAccessItem, "hint" | "attention">> = {
    "/agent/staff": { hint: `${formatNumber(agent.employeeCount)} deployed` },
    "/agent/requests": { hint: `${formatNumber(pendingStaff)} awaiting approval`, attention: pendingStaff },
    "/agent/off-days": { hint: "Give your employees days off" },
    "/agent/summaries": { hint: `${formatNumber(summaries.length)} statements` },
    "/agent/invoices": { hint: `${formatNumber(summaries.length)} invoices` },
    "/agent/payslips": { hint: "What each employee is paid" },
    "/agent/loans": { hint: `${formatNumber(pendingLoans)} awaiting approval`, attention: pendingLoans },
    "/agent/advances": { hint: `${formatMoneyCompact(outstanding)} outstanding`, attention: pendingAdvances },
    "/agent/payments": { hint: `${formatNumber(toRecord)} to record`, attention: pendingMoney },
    "/agent/profile": { hint: "Your details and contract" },
  };

  const quickAccess: QuickAccessItem[] = [
    { href: "/agent/dashboard/branches", title: "Branches", icon: "location_city", hint: branches ? `${formatNumber(branches.length)} branches` : "Your employees by branch" },
    { href: "/agent/staff/new", title: "Add Employee", icon: "person_add", hint: "Sent to an Admin to approve" },
    ...navigationFor(session.role)
      .filter((item) => item.href !== "/agent/dashboard")
      .map((item) => ({ href: item.href, title: item.title, icon: item.icon, ...(hints[item.href] ?? { hint: `Open ${item.title}` }) })),
  ];

  const trend: BarDatum[] = summaries
    .slice(0, 6)
    .reverse()
    .map((s) => ({
      label: MONTHS[Number(s.periodEnd.slice(5, 7)) - 1] ?? "—",
      value: s.amountPayable,
      tooltip: formatMoney(s.amountPayable),
    }));
  const trendMax = Math.max(1, ...trend.map((point) => point.value));

  return (
    <div className="flex flex-col gap-gutter">
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/agent/requests" className={CARD_LINK}>
          <MetricCard
            className="w-full hover:bg-surface-container-low"
            label="Awaiting Approval"
            value={formatNumber(awaiting)}
            icon="pending_actions"
            tone={awaiting > 0 ? "amber" : "primary"}
            accent={awaiting > 0}
            hint={`${formatNumber(pendingStaff)} staff · ${formatNumber(pendingMoney + pendingAdvances + pendingLoans)} money`}
          />
        </Link>
        <Link href="/agent/staff" className={CARD_LINK}>
          <MetricCard
            className="w-full hover:bg-surface-container-low"
            label="Clocked In Now"
            value={today ? formatNumber(today.currentlyIn) : "—"}
            icon="schedule"
            tone="primary"
            hint={today ? `${formatNumber(today.reported)} of ${formatNumber(today.employees)} of your staff reported today` : "Could not be read"}
          />
        </Link>
        <Link href="/agent/staff" className={CARD_LINK}>
          <MetricCard className="w-full hover:bg-surface-container-low" label="Deployed Staff" value={formatNumber(agent.employeeCount)} icon="group" tone="primary" />
        </Link>
        <Link href="/agent/summaries" className={CARD_LINK}>
          <MetricCard
            className="w-full hover:bg-surface-container-low"
            label="Latest Amount Payable"
            value={latest ? formatMoneyCompact(latest.amountPayable) : "—"}
            icon="receipt_long"
            tone="primary"
            hint={latest ? formatDateRange(latest.periodStart, latest.periodEnd) : "No payment yet"}
          />
        </Link>
      </div>

      {outstanding > 0 ? (
        <AlertSpotlight
          eyebrow="Advance Balance"
          title={`${formatMoney(outstanding)} outstanding`}
          message="Outstanding advances are deducted automatically from your next payment."
          cta="View Advances"
          href="/agent/advances"
        />
      ) : null}

      <QuickAccess items={quickAccess} />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <BentoCard className="flex min-h-64 flex-col lg:col-span-8" title="Amount Payable Trend" subtitle="Last 6 periods" bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2">
          {trend.length === 0 ? (
            <EmptyState symbol="bar_chart" title="No payments yet" description="Your statements appear here once the Administrator calculates a period that includes your staff." />
          ) : (
            <BarChart
              data={trend}
              max={trendMax}
              axisLabels={[formatMoneyCompact(trendMax, { showCurrency: false }), formatMoneyCompact(trendMax / 2, { showCurrency: false }), "0"]}
              tone="primary"
            />
          )}
        </BentoCard>

        <BentoCard className="lg:col-span-4" title="Contract Terms">
          <div className="flex flex-col">
            <Row label="Agent fee" value={chargeSummary(agent)} />
            <Row label="KRA PIN" value={agent.kraPin ?? "—"} />
            <Row label="Contract start" value={formatDate(agent.contractStartDate)} />
            <Row label="Contract end" value={formatDate(agent.contractEndDate)} />
          </div>
        </BentoCard>
      </div>

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
                      <Link href={`/agent/summaries/${s.id}`}>{formatDateRange(s.periodStart, s.periodEnd)}</Link>
                    </td>
                    <td className="py-3 tabular-nums text-on-surface-variant">{formatNumber(s.employeeCount)}</td>
                    <td className="py-3 text-right tabular-nums text-on-surface-variant">{formatMoney(settlementSubtotal(s), { showCurrency: false })}</td>
                    <td className="py-3 pr-2 text-right font-semibold tabular-nums text-on-surface">{formatMoney(s.amountPayable, { showCurrency: false })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>
    </div>
  );
}
