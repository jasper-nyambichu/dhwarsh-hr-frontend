import { ApiError } from "@/app/lib/api-error";
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { QuickAccess, type QuickAccessItem } from "@/components/features/dashboard/quick-access";
import { BranchCards, existingEmployees, type BranchCardItem } from "@/components/features/employee/branch-directory";
import { OffListCard } from "@/components/features/off-days/off-list-card";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { Icon } from "@/components/ui/icon";
import { navigationFor } from "@/config/navigation";
import { chargeSummary, settlementSubtotal } from "@/lib/agent-format";
import { inPeriod, payPeriods, payTotals } from "@/lib/agent-pay";
import { getMyAgent } from "@/lib/api/agent";
import { getAgentLoans, getMyAdvances, getMyPaymentRequests } from "@/lib/api/agent-money";
import { getMyAgentAttendanceToday } from "@/lib/api/attendance";
import { getBranches } from "@/lib/api/branch";
import { getMyBranchDirectory } from "@/lib/api/employee";
import { getMyAgentPayslips } from "@/lib/api/payslip";
import { getMyOffDays } from "@/lib/api/off-day";
import { getMyAgentPayments } from "@/lib/api/settlement";
import { getMyStaffRequests } from "@/lib/api/staff";
import { groupByEmployee, monthRange, parseMonth } from "@/lib/off-days";
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
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const month = parseMonth(undefined);
  const [advancesResult, staffRequestsResult, paymentRequestsResult, loansResult, todayResult, offDaysResult, branchesResult, payslipsResult] =
    await Promise.allSettled([
      getMyAdvances(),
      getMyStaffRequests(),
      getMyPaymentRequests(),
      getAgentLoans(),
      getMyAgentAttendanceToday(),
      getMyOffDays(monthRange(month)),
      getBranches(),
      getMyAgentPayslips(),
    ]);

  const { agent, summaries } = core;
  const advances = value(advancesResult);
  const staffRequests = value(staffRequestsResult);
  const paymentRequests = value(paymentRequestsResult);
  const loans = value(loansResult);
  const today = value(todayResult);
  const offDays = value(offDaysResult);
  const offList = offDays ? groupByEmployee(offDays, month) : null;
  const branches = value(branchesResult);
  const payslips = value(payslipsResult);

  // One card per branch where the agent has employees; a branch whose list cannot be read still shows.
  const branchItems: BranchCardItem[] = [];
  if (branches) {
    const lists = await Promise.allSettled(branches.map((branch) => getMyBranchDirectory(branch.id)));
    branches.forEach((branch, index) => {
      const list = lists[index];
      const employeeCount = list?.status === "fulfilled" ? existingEmployees(list.value).length : null;
      if (employeeCount !== 0) branchItems.push({ branch, employeeCount });
    });
  }

  // Payslips of the most recent period the Administrator calculated.
  const latestPeriod = payslips ? (payPeriods(payslips)[0] ?? null) : null;
  const latestPayslips = payslips && latestPeriod ? inPeriod(payslips, latestPeriod) : [];
  const latestTotals = payTotals(latestPayslips);

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
    "/agent/employees": { hint: `${formatNumber(agent.employeeCount)} employees` },
    "/agent/requests": { hint: `${formatNumber(pendingStaff)} awaiting approval`, attention: pendingStaff },
    "/agent/off-days": { hint: offList ? `${formatNumber(offList.length)} off this month` : "Give your employees days off" },
    "/agent/summaries": { hint: `${formatNumber(summaries.length)} statements` },
    "/agent/invoices": { hint: `${formatNumber(summaries.length)} invoices` },
    "/agent/payslips": { hint: "What each employee is paid" },
    "/agent/loans": { hint: `${formatNumber(pendingLoans)} awaiting approval`, attention: pendingLoans },
    "/agent/advances": { hint: `${formatMoneyCompact(outstanding)} outstanding`, attention: pendingAdvances },
    "/agent/payments": { hint: `${formatNumber(toRecord)} to record`, attention: pendingMoney },
    "/agent/profile": { hint: "Your details and contract" },
  };

  const quickAccess: QuickAccessItem[] = [
    { href: "/agent/employees/new", title: "Add Employee", icon: "person_add", hint: "Sent to an Admin to approve" },
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
            hint={`${formatNumber(pendingStaff)} employees · ${formatNumber(pendingMoney + pendingAdvances + pendingLoans)} money`}
          />
        </Link>
        <Link href="/agent/employees" className={CARD_LINK}>
          <MetricCard
            className="w-full hover:bg-surface-container-low"
            label="Clocked In Now"
            value={today ? formatNumber(today.currentlyIn) : "—"}
            icon="schedule"
            tone="primary"
            hint={today ? `${formatNumber(today.reported)} of ${formatNumber(today.employees)} of your employees reported today` : "Could not be read"}
          />
        </Link>
        <Link href="/agent/employees" className={CARD_LINK}>
          <MetricCard className="w-full hover:bg-surface-container-low" label="Employees" value={formatNumber(agent.employeeCount)} icon="group" tone="primary" />
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

      <section aria-labelledby="branches-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="branches-heading" className="text-lg font-bold text-on-surface">Branches</h2>
            <p className="text-sm text-on-surface-variant">Open a branch to see all your employees there.</p>
          </div>
          <Link href="/agent/employees" className="text-sm font-semibold text-primary hover:underline">
            All employees
          </Link>
        </div>
        {branches === null ? (
          <p className="rounded-card bg-surface-container-lowest p-4 text-sm text-on-surface-variant shadow-ambient-1">Branches could not be read.</p>
        ) : branchItems.length === 0 ? (
          <EmptyState symbol="location_off" title="No employees yet" description="Branches appear here once you have approved employees working at them." />
        ) : (
          <BranchCards basePath="/agent/employees/branches" items={branchItems} />
        )}
      </section>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <BentoCard
          title="Payslips"
          subtitle={latestPeriod ? `Latest period: ${formatDateRange(latestPeriod.start, latestPeriod.end)}` : "No payslips yet"}
          action={
            <Link href="/agent/payslips" className="flex min-h-9 items-center gap-1 rounded-lg border border-outline-variant px-3 text-sm font-semibold text-primary hover:bg-surface-container-low">
              View all
              <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          }
        >
          {payslips === null ? (
            <p className="text-sm text-on-surface-variant">Payslips could not be read.</p>
          ) : latestPayslips.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Each employee&apos;s payslip appears here once the Administrator calculates a period. It shows the days, PAYE, NSSF, NITA and
              every loan and damage taken off.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <dl className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3">
                <div className="rounded-lg bg-surface-container-low p-3">
                  <dt className="text-[11px] text-on-surface-variant">Employees</dt>
                  <dd className="text-lg font-bold tabular-nums text-on-surface">{formatNumber(latestPayslips.length)}</dd>
                </div>
                <div className="rounded-lg bg-surface-container-low p-3">
                  <dt className="text-[11px] text-on-surface-variant">Deductions</dt>
                  <dd className="text-lg font-bold tabular-nums text-error">{formatMoneyCompact(latestTotals.deductions)}</dd>
                </div>
                <div className="rounded-lg bg-surface-container-low p-3">
                  <dt className="text-[11px] text-on-surface-variant">To pay employees</dt>
                  <dd className="text-lg font-bold tabular-nums text-on-surface">{formatMoneyCompact(latestTotals.amountDue)}</dd>
                </div>
              </dl>
              <ul className="flex flex-col divide-y divide-outline-variant/30">
                {latestPayslips.slice(0, 5).map((payslip) => (
                  <li key={payslip.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/agent/payslips/${payslip.id}`} className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-primary">{payslip.employeeName}</span>
                      <span className="block truncate text-xs text-on-surface-variant">{payslip.branchName ?? "—"}</span>
                    </Link>
                    <span className="flex shrink-0 items-center gap-1">
                      <span className="text-sm font-semibold tabular-nums text-on-surface">{formatMoney(payslip.amountDue, { showCurrency: false })}</span>
                      <a
                        href={`/api/payslips/${payslip.id}?download=1`}
                        aria-label={`Download payslip of ${payslip.employeeName}`}
                        title="Download PDF"
                        className="flex size-10 items-center justify-center rounded-lg text-primary hover:bg-surface-container-low"
                      >
                        <Icon name="download" className="text-[20px]" />
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </BentoCard>

        <BentoCard
          title="Advances"
          subtitle="Ask the Administrator for an advance. Once given, it is taken off your next payment."
          action={
            <Link href="/agent/advances" className="flex min-h-9 items-center gap-1 rounded-lg border border-outline-variant px-3 text-sm font-semibold text-primary hover:bg-surface-container-low">
              View all
              <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          }
        >
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              <div className="rounded-lg bg-surface-container-low p-3">
                <dt className="text-[11px] text-on-surface-variant">Given, still to deduct</dt>
                <dd className="text-lg font-bold tabular-nums text-on-surface">{advances ? formatMoney(outstanding) : "—"}</dd>
              </div>
              <div className="rounded-lg bg-surface-container-low p-3">
                <dt className="text-[11px] text-on-surface-variant">Waiting for the Administrator</dt>
                <dd className="text-lg font-bold tabular-nums text-on-surface">{advances ? formatNumber(pendingAdvances) : "—"}</dd>
              </div>
            </dl>
            <p className="text-xs text-on-surface-variant">
              When the Administrator calculates the period, the advance is deducted from the total amount payable to you and shows as
              &ldquo;Advances&rdquo; on your statement.
            </p>
            <Link
              href="/agent/advances"
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container sm:self-start"
            >
              <Icon name="add" className="text-[18px]" />
              Request an advance
            </Link>
          </div>
        </BentoCard>
      </div>

      <QuickAccess items={quickAccess} />

      <OffListCard
        groups={offList}
        month={month}
        href="/agent/off-days"
        showBranch
        wide
        emptyDescription="Days you give your employees off appear here."
      />

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
            <table className="data-table w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Period</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Employees</th>
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
