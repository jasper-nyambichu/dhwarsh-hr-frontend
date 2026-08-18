import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { Icon } from "@/components/ui/icon";
import { formatMoneyCompact, formatNumber, initials } from "@/lib/format";

/**
 * Payroll Officer dashboard.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/dashboard/payroll` endpoint yet. Replace the
 * constants with `await api.get<PayrollDashboard>("/dashboard/payroll")`
 * when it lands; every component here takes props, so nothing else changes.
 * ─────────────────────────────────────────────────────────────────────────
 */

const KPI = {
  currentRunGross: 18_400_000,
  employeesPaid: 1_204,
  pendingApprovals: 6,
} as const;

const COST_TREND: readonly BarDatum[] = [
  { label: "May", value: 16.2, tooltip: "KES 16.2M" },
  { label: "Jun", value: 16.8, tooltip: "KES 16.8M" },
  { label: "Jul", value: 16.4, tooltip: "KES 16.4M" },
  { label: "Aug", value: 17.1, tooltip: "KES 17.1M" },
  { label: "Sep", value: 17.8, tooltip: "KES 17.8M" },
  { label: "Oct", value: 17.5, tooltip: "KES 17.5M" },
  { label: "Nov", value: 18.4, tooltip: "KES 18.4M" },
];

/** Run status breakdown, whole percent, ordered draft → completed. */
const RUN_STATUS = [
  { label: "Draft", pct: 15, count: 3, color: "bg-surface-variant" },
  { label: "Processing", pct: 25, count: 5, color: "bg-secondary-container" },
  { label: "Approved", pct: 20, count: 4, color: "bg-primary" },
  { label: "Completed", pct: 40, count: 8, color: "bg-tertiary" },
] as const;

const RECENT_RUNS = [
  { id: 1, period: "Nov 2026 — Main", branch: "Nairobi HQ", employees: 452, gross: 8_200_000, net: 5_800_000, status: "Completed" as const },
  { id: 2, period: "Nov 2026 — Ops", branch: "Mombasa Port", employees: 310, gross: 4_100_000, net: 2_900_000, status: "Approved" as const },
  { id: 3, period: "Nov 2026 — Sales", branch: "Kisumu", employees: 128, gross: 2_500_000, net: 1_700_000, status: "Processing" as const },
  { id: 4, period: "Nov 2026 — Casuals", branch: "Eldoret", employees: 215, gross: 1_800_000, net: 1_500_000, status: "Draft" as const },
];

const RUN_STATUS_CHIP: Record<(typeof RECENT_RUNS)[number]["status"], string> = {
  Completed: "bg-tertiary-container/20 text-tertiary",
  Approved: "bg-secondary-container/30 text-primary",
  Processing: "bg-surface-variant text-on-surface-variant",
  Draft: "bg-surface-variant text-on-surface-variant",
};

const LOANS_ADVANCES = [
  { id: 1, name: "David Omondi", note: "Salary Advance", amount: 45_000, status: "Approved", statusTone: "text-tertiary" },
  { id: 2, name: "Mercy Wanjiku", note: "Car Loan Instalment", amount: 12_500, status: "Processing", statusTone: "text-on-surface-variant" },
  { id: 3, name: "Peter Kiprono", note: "Emergency Advance", amount: 20_000, status: "Pending Doc", statusTone: "text-error" },
  { id: 4, name: "John Mutua", note: "Mortgage Deduction", amount: 85_000, status: "Active", statusTone: "text-tertiary" },
] as const;

const DEDUCTIONS_SPLIT = [
  { label: "PAYE", value: 55, color: "var(--color-primary)" },
  { label: "NSSF", value: 15, color: "var(--color-primary-container)" },
  { label: "SHIF", value: 20, color: "var(--color-secondary-fixed-dim)" },
  { label: "Housing Levy", value: 10, color: "var(--color-surface-variant)" },
] as const;

export default async function PayrollDashboardPage() {
  await requirePermission("payroll:read");

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* ───────────────────────────────── main column ─────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard
            label="Current Run"
            value={formatMoneyCompact(KPI.currentRunGross)}
            icon="payments"
            tone="primary"
            hint="+2.4% from last month"
          />
          <MetricCard
            label="Employees Paid"
            value={formatNumber(KPI.employeesPaid)}
            icon="group"
            hint="+12 new hires"
          />
          <MetricCard
            label="Pending Approvals"
            value={formatNumber(KPI.pendingApprovals)}
            icon="pending_actions"
            tone="error"
            accent
            hint="Requires immediate attention"
          />
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <BentoCard
            title="Payroll Cost Trend"
            subtitle="Last 7 months"
            className="flex min-h-64 flex-col"
            bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2"
          >
            <BarChart data={COST_TREND} max={20} axisLabels={["20M", "10M", "0"]} tone="primary" />
          </BentoCard>

          <BentoCard
            title="Run Status"
            subtitle="Current period"
            className="flex min-h-64 flex-col"
            bodyClassName="flex flex-1 flex-col"
          >
            <div className="flex h-3 w-full shrink-0 overflow-hidden rounded-full shadow-inner">
              {RUN_STATUS.map((segment) => (
                <div key={segment.label} className={segment.color} style={{ width: `${segment.pct}%` }} />
              ))}
            </div>
            <ul className="mt-4 flex flex-1 flex-col justify-center gap-3">
              {RUN_STATUS.map((segment) => (
                <li key={segment.label} className="flex items-center justify-between gap-2 font-body-md text-body-md">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`size-2.5 shrink-0 rounded-full ${segment.color}`} />
                    <span className="truncate text-on-surface">{segment.label}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-on-surface">
                    {segment.pct}% ({segment.count} runs)
                  </span>
                </li>
              ))}
            </ul>
          </BentoCard>
        </div>

        <BentoCard
          title="Recent Payroll Runs"
          action={
            <Link href="/payroll/runs" className="text-[10px] text-primary-container hover:underline">
              View All
            </Link>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Period</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Branch</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Employees</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Gross</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Net</th>
                  <th className="pb-3 pr-2 font-table-header text-table-header uppercase text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {RECENT_RUNS.map((run) => (
                  <tr key={run.id} className="group transition-colors">
                    <td className="py-3 pl-2 font-medium text-on-surface">
                      <Link href={`/payroll/runs/${run.id}`} className="group-hover:text-primary-container">
                        {run.period}
                      </Link>
                    </td>
                    <td className="py-3 text-on-surface-variant">{run.branch}</td>
                    <td className="py-3 tabular-nums text-on-surface-variant">{formatNumber(run.employees)}</td>
                    <td className="py-3 text-right tabular-nums text-on-surface-variant">
                      {formatMoneyCompact(run.gross, { showCurrency: false })}
                    </td>
                    <td className="py-3 text-right tabular-nums text-on-surface-variant">
                      {formatMoneyCompact(run.net, { showCurrency: false })}
                    </td>
                    <td className="py-3 pr-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RUN_STATUS_CHIP[run.status]}`}
                      >
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>

      {/* ──────────────────────────────── side column ──────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-4">
        <div className="flex gap-2">
          <select className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 font-body-md text-body-md text-on-surface shadow-sm focus:border-primary-container focus:outline-none">
            <option>November 2026</option>
            <option>October 2026</option>
            <option>Year to Date (2026)</option>
          </select>
          <button
            type="button"
            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-on-primary-fixed-variant px-4 py-2 font-body-md text-[11px] font-medium text-on-primary transition-colors hover:bg-primary"
          >
            <Icon name="download" className="text-[18px]" />
            Download
          </button>
        </div>

        <SegmentStrip
          segments={[
            { label: "Processed", value: formatNumber(412) },
            { label: "Pending", value: formatNumber(190) },
            { label: "On Hold", value: formatNumber(96), tone: "warning" },
          ]}
        />

        <AlertSpotlight
          eyebrow="Payroll Alert"
          title="2 runs are awaiting your approval"
          message="Mombasa Port & Nairobi HQ"
          cta="Review Now"
          href="/payroll/runs"
        />

        <BentoCard title="Loans & Advances">
          <ul className="flex flex-col gap-4">
            {LOANS_ADVANCES.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container"
                >
                  {initials(item.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body-md text-body-md font-medium text-on-surface">
                    {item.name}
                  </span>
                  <span className="block text-[10px] text-on-surface-variant">{item.note}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-body-md text-body-md font-bold text-on-surface">
                    {formatMoneyCompact(item.amount, { showCurrency: false })}
                  </span>
                  <span className={`block text-[10px] ${item.statusTone}`}>{item.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </BentoCard>

        <BentoCard title="Deductions Split">
          <DonutChart segments={DEDUCTIONS_SPLIT} size={160} legend="value" centerLabel="Total" />
        </BentoCard>
      </div>
    </div>
  );
}