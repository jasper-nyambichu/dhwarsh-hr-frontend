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
      {/* 4-up only once there is room for it: at md each tile is ~141px wide,
          ~93px inside its padding, and "KES 14,250,000" needs ~170px. */}
      <section className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="bento-card relative flex min-w-0 flex-col gap-2 overflow-hidden p-4 sm:p-card-padding">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 text-[10px] font-semibold uppercase text-on-surface-variant">{m.label}</span>
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${m.iconBg} ${m.iconColor}`}>
                <Icon name={m.icon} className="text-sm" />
              </div>
            </div>
            {/* `break-words` not `truncate`: a clipped currency figure is worse
                than a wrapped one — "KES 14,2…" actively misleads. */}
            <div className={`mt-2 break-words font-card-stat text-card-stat tabular-nums ${m.valueColor ?? "text-on-surface"}`}>
              {m.value}
            </div>
            <div className={`mt-1 flex items-center gap-1 text-xs ${m.trendColor}`}>
              {m.trendIcon && <Icon name={m.trendIcon} className="shrink-0 text-[14px]" />}
              {m.trend}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="bento-card col-span-1 flex min-h-[320px] min-w-0 flex-col p-4 sm:p-card-padding md:col-span-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-on-surface">Disbursement Trends</h2>
            <select className="rounded-md border border-outline-variant bg-surface px-3 py-1 text-sm text-on-surface-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="relative flex min-h-0 flex-1 items-end gap-2 overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-4 pb-4 sm:gap-4">
            {TREND_BARS.map((h, i) => (
              <div
                key={i}
                className={`relative z-10 min-w-0 flex-1 rounded-t-sm transition-colors ${
                  i === 3 ? "bg-primary-container shadow-sm" : "bg-primary-fixed/40 hover:bg-primary-fixed"
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="bento-card col-span-1 flex min-h-[320px] min-w-0 flex-col p-4 sm:p-card-padding md:col-span-4">
          <h2 className="mb-6 text-xl font-bold text-on-surface">Statutory Expense Split</h2>
          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
            {/* The overlay ring is inset by its own border width, so it reaches
                16px past the 128px circle — `shrink-0` keeps the flex column
                from squeezing it into an ellipse. */}
            <div className="relative size-32 shrink-0 rounded-full border-[16px] border-primary-container">
              <div className="absolute inset-[-16px] rotate-45 rounded-full border-[16px] border-secondary-fixed border-r-transparent border-t-transparent" />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-on-surface">Total</div>
            </div>
            <div className="flex w-full flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-3 shrink-0 rounded-full bg-primary-container" />
                  <span className="truncate">PAYE</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-on-surface">65%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-3 shrink-0 rounded-full bg-secondary-fixed" />
                  <span className="truncate">NHIF/NSSF</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-on-surface">35%</span>
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
              className="bento-card flex min-h-[200px] min-w-0 flex-col justify-between border border-transparent p-4 transition-all hover:border-primary-fixed sm:p-card-padding"
            >
              <div className="flex flex-col gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary-container">
                  <Icon name={report.icon} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-on-surface">{report.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{report.description}</p>
                </div>
              </div>
              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-soft px-4 py-2 text-sm font-medium text-primary-container transition-colors hover:bg-primary hover:text-on-primary"
              >
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