import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { Icon } from "@/components/ui/icon";
import { formatMoneyCompact, formatNumber, initials } from "@/lib/format";

/**
 * Finance Officer dashboard.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/dashboard/finance` endpoint yet. Replace with
 * `await api.get<FinanceDashboard>("/dashboard/finance")` when it lands.
 * ─────────────────────────────────────────────────────────────────────────
 */

const KPI = {
  disbursedThisMonth: 22_100_000,
  pendingInvoices: 14,
  statutoryDue: 3_600_000,
} as const;

/** Two-series cash-out trend, KES millions, oldest first. */
const CASH_OUT_TREND = {
  months: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
  series2025: [15, 16, 15.5, 17, 16.5, 18],
  series2026: [17, 18, 19, 20.5, 21, 22.1],
} as const;

const DISBURSEMENT_STATUS = [
  { label: "Sent", value: 85, color: "var(--color-primary)" },
  { label: "Queued", value: 10, color: "var(--color-secondary)" },
  { label: "Failed", value: 5, color: "var(--color-error)" },
] as const;

const PENDING_DISBURSEMENTS = [
  { id: 1, run: "Nov 2026 — Main", branch: "Nairobi HQ", employees: 145, amount: 12_450_000, method: "Bank Transfer", status: "Queued" as const },
  { id: 2, run: "Nov 2026 — Temp", branch: "Mombasa", employees: 32, amount: 1_200_000, method: "Mobile Money", status: "Queued" as const },
  { id: 3, run: "Oct 2026 — Bonus", branch: "All Branches", employees: 210, amount: 5_500_000, method: "Bank Transfer", status: "Failed" as const },
];

const DISBURSEMENT_CHIP: Record<(typeof PENDING_DISBURSEMENTS)[number]["status"], string> = {
  Queued: "bg-blue-soft text-primary-container",
  Failed: "bg-error/10 text-error",
};

const AGENT_INVOICES = [
  { id: 1, name: "Sarah Mutuku", invoice: "Inv #4092", amount: 45_000 },
  { id: 2, name: "John Ochieng", invoice: "Inv #4093", amount: 12_000 },
  { id: 3, name: "Grace Wanjiku", invoice: "Inv #4094", amount: 89_000 },
] as const;

const STATUTORY_BREAKDOWN = [
  { label: "PAYE", value: 55, color: "var(--color-primary)" },
  { label: "NSSF", value: 15, color: "var(--color-secondary)" },
  { label: "SHIF", value: 20, color: "var(--color-tertiary)" },
  { label: "Housing Levy", value: 10, color: "var(--color-surface-variant)" },
] as const;

export default async function FinanceDashboardPage() {
  await requirePermission("invoice:read");

  const trendMax = Math.max(...CASH_OUT_TREND.series2025, ...CASH_OUT_TREND.series2026);
  const toPoints = (series: readonly number[]) =>
    series
      .map((v, i) => {
        const x = (i / (series.length - 1)) * 100;
        const y = 100 - (v / trendMax) * 100;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* ───────────────────────────────── main column ─────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard
            label="Disbursed This Month"
            value={formatMoneyCompact(KPI.disbursedThisMonth)}
            icon="payments"
            tone="primary"
          />
          <MetricCard
            label="Pending Invoices"
            value={formatNumber(KPI.pendingInvoices)}
            icon="receipt_long"
          />
          <MetricCard
            label="Statutory Due"
            value={formatMoneyCompact(KPI.statutoryDue)}
            icon="account_balance"
            tone="error"
            accent
          />
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <BentoCard
            title="Cash Out Trend"
            subtitle="2025 vs 2026"
            className="flex min-h-64 flex-col"
            bodyClassName="flex flex-1 flex-col"
          >
            <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2">
              {/* `flex-1` rather than `h-full`: a percentage height needs a
                  definite parent, and this column's height comes from the card,
                  so `h-full` here resolves against nothing. */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="min-h-0 w-full flex-1">
                <polyline
                  points={toPoints(CASH_OUT_TREND.series2025)}
                  fill="none"
                  stroke="var(--color-outline-variant)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  points={toPoints(CASH_OUT_TREND.series2026)}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="mt-2 flex justify-between font-body-md text-[10px] text-outline">
                {CASH_OUT_TREND.months.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body-md text-[10px] text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full bg-outline-variant" /> 2025
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full bg-primary" /> 2026
                </span>
              </div>
            </div>
          </BentoCard>

          <BentoCard title="Disbursement Status" className="flex min-h-64 flex-col" bodyClassName="flex flex-1 flex-col justify-center">
            <DonutChart segments={DISBURSEMENT_STATUS} size={140} legend="value" centerLabel="Status" />
          </BentoCard>
        </div>

        <BentoCard
          title="Pending Disbursements"
          action={
            <Link href="/finance/disbursements" className="text-[10px] text-primary-container hover:underline">
              View All
            </Link>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Run</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Branch</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Employees</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Amount</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Method</th>
                  <th className="pb-3 pr-2 font-table-header text-table-header uppercase text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {PENDING_DISBURSEMENTS.map((row) => (
                  <tr key={row.id} className="group transition-colors">
                    <td className="py-3 pl-2 font-medium text-on-surface">
                      <Link href={`/finance/disbursements/${row.id}`} className="group-hover:text-primary-container">
                        {row.run}
                      </Link>
                    </td>
                    <td className="py-3 text-on-surface-variant">{row.branch}</td>
                    <td className="py-3 tabular-nums text-on-surface-variant">{formatNumber(row.employees)}</td>
                    <td className="py-3 text-right font-semibold tabular-nums text-on-surface">
                      {formatMoneyCompact(row.amount, { showCurrency: false })}
                    </td>
                    <td className="py-3 text-on-surface-variant">{row.method}</td>
                    <td className="py-3 pr-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${DISBURSEMENT_CHIP[row.status]}`}>
                        {row.status}
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
        <div className="flex flex-col gap-3">
          <select className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none">
            <option>Current Month (Nov 2026)</option>
            <option>Last Month (Oct 2026)</option>
          </select>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-on-primary-fixed-variant px-4 py-2 font-body-md text-body-md font-bold text-on-primary transition-colors hover:bg-primary"
          >
            <Icon name="download" className="text-[18px]" />
            Download Report
          </button>
        </div>

        <SegmentStrip
          segments={[
            { label: "Sent", value: formatNumber(388) },
            { label: "Queued", value: formatNumber(42) },
            { label: "Failed", value: formatNumber(3), tone: "warning" },
          ]}
        />

        <AlertSpotlight
          eyebrow="Action Required"
          title="PAYE remittance is due in 4 days"
          message="Prepare the filing before the statutory cutoff."
          cta="Review Statutory"
          href="/finance/statutory"
        />

        <BentoCard
          title="Agent Invoices"
          action={
            <Link href="/finance/invoices" className="text-[10px] text-primary-container hover:underline">
              View All
            </Link>
          }
        >
          <ul className="flex flex-col gap-3">
            {AGENT_INVOICES.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container"
                  >
                    {initials(inv.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-body-md text-body-md font-medium text-on-surface">
                      {inv.name}
                    </span>
                    <span className="block text-[10px] text-on-surface-variant">{inv.invoice}</span>
                  </span>
                </span>
                <span className="shrink-0 font-body-md text-body-md font-bold text-primary">
                  {formatMoneyCompact(inv.amount, { showCurrency: false })}
                </span>
              </li>
            ))}
          </ul>
        </BentoCard>

        <BentoCard title="Statutory Breakdown">
          <DonutChart segments={STATUTORY_BREAKDOWN} size={140} legend="value" />
        </BentoCard>
      </div>
    </div>
  );
}