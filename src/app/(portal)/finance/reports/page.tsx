// src/app/(portal)/finance/reports/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — cash-flow metrics and chart data need a real
 * `/finance/reports/summary` (or similar) endpoint. The bar/donut charts
 * below are static mockups matching the Stitch design — swap for a real
 * charting lib (recharts is available) once data is wired up.
 * ─────────────────────────────────────────────────────────────────────────
 */
const METRICS = [
  { label: "Total Inflow (MTD)", value: "KES 14,250,000", trend: "+12.5% vs last month", trendIcon: "trending_up", trendColor: "text-tertiary", iconBg: "bg-primary-fixed", iconColor: "text-primary", icon: "south_east" },
  { label: "Total Outflow (MTD)", value: "KES 8,140,500", trend: "-1.2% vs last month", trendIcon: "trending_flat", trendColor: "text-on-surface-variant", iconBg: "bg-error-container", iconColor: "text-on-error-container", icon: "north_east" },
  { label: "Net Cash Position", value: "KES 6,109,500", valueColor: "text-primary", trend: "Healthy Liquidity", trendIcon: null, trendColor: "text-tertiary", iconBg: "bg-secondary-fixed", iconColor: "text-secondary", icon: "account_balance_wallet" },
  { label: "Pending Clearances", value: "12 Items", trend: "Action required today", trendIcon: null, trendColor: "text-on-surface-variant", iconBg: "bg-surface-variant", iconColor: "text-on-surface-variant", icon: "pending_actions" },
];

const REPORT_CATALOGUE = [
  { title: "Cash Flow Statement", description: "Comprehensive view of all inflows and outflows for reconciliation.", icon: "insert_chart" },
  { title: "Disbursement Register", description: "Detailed log of all completed and pending payouts.", icon: "list_alt" },
  { title: "Agent Payment Summary", description: "Aggregated payout data grouped by agent or department.", icon: "groups" },
  { title: "Statutory Filing History", description: "Historical records of tax and compliance filings.", icon: "gavel" },
];

const TREND_BARS = [40, 60, 30, 80, 50, 70]; // percentage heights, last month highlighted

export default async function FinanceReportsPage() {
  await requirePermission("report:read");

  return (
    <div className="flex flex-1 flex-col gap-gutter">
      <section className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="relative flex flex-col gap-2 overflow-hidden rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,42,69,.10)]">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-semibold uppercase text-on-surface-variant">{m.label}</span>
              <div className={`flex size-8 items-center justify-center rounded-full ${m.iconBg} ${m.iconColor}`}>
                <Icon name={m.icon} className="text-sm" />
              </div>
            </div>
            <div className={`mt-2 text-2xl font-bold ${m.valueColor ?? "text-on-surface"}`}>{m.value}</div>
            <div className={`mt-1 flex items-center gap-1 text-xs ${m.trendColor}`}>
              {m.trendIcon && <Icon name={m.trendIcon} className="text-[14px]" />}
              {m.trend}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="col-span-1 flex h-[320px] flex-col rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] md:col-span-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Disbursement Trends</h2>
            <select className="rounded-md border border-outline-variant bg-surface px-3 py-1 text-sm text-on-surface-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="relative flex flex-1 items-end gap-4 overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-4 pb-4">
            {TREND_BARS.map((h, i) => (
              <div
                key={i}
                className={`relative z-10 w-full rounded-t-sm transition-colors ${
                  i === 3 ? "bg-primary-container shadow-sm" : "bg-primary-fixed/40 hover:bg-primary-fixed"
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="col-span-1 flex h-[320px] flex-col rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] md:col-span-4">
          <h2 className="mb-6 text-xl font-bold text-on-surface">Statutory Expense Split</h2>
          <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
            <div className="relative size-32 rounded-full border-[16px] border-primary-container">
              <div className="absolute inset-[-16px] rotate-45 rounded-full border-[16px] border-secondary-fixed border-r-transparent border-t-transparent" />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-on-surface">Total</div>
            </div>
            <div className="flex w-full flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-primary-container" />
                  PAYE
                </span>
                <span className="font-medium text-on-surface">65%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-secondary-fixed" />
                  NHIF/NSSF
                </span>
                <span className="font-medium text-on-surface">35%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-on-surface">Standard Reports</h2>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {REPORT_CATALOGUE.map((report) => (
            <div
              key={report.title}
              className="flex h-[200px] flex-col justify-between rounded-2xl border border-transparent bg-white p-6 shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-all hover:border-primary-fixed"
            >
              <div className="flex flex-col gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-surface-container text-primary-container">
                  <Icon name={report.icon} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">{report.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{report.description}</p>
                </div>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-[#e6f0f8] px-4 py-2 text-sm font-medium text-[#1c6eb4] transition-colors hover:bg-primary hover:text-white">
                Generate
                <Icon name="arrow_forward" className="text-sm" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}