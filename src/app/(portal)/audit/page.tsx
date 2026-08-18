// app/(dashboard)/payroll-trail/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { Icon } from "@/components/ui/icon";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — stats + rows should come from a payroll-audit
 * endpoint once available.
 * ─────────────────────────────────────────────────────────────────────────
 */
const STATS = [
  { label: "Total Adjustments", value: "1,248", icon: "tune", trend: "+12% from last period", trendUp: true },
  { label: "High Variance Flags", value: "24", icon: "warning", note: "Requires immediate review", isAlert: true },
  { label: "Total Value Altered", value: "$45,200.00", icon: "payments", note: "Net change across all overrides" },
] as const;

interface PayrollRow {
  id: number;
  run: string;
  actor: string;
  initials: string;
  actionType: "Adjustment" | "Override" | "Reversal";
  amount: string;
  isNegative?: boolean;
  timestamp: string;
  flagged?: boolean;
}

const ROWS: PayrollRow[] = [
  { id: 1, run: "PR-2023-10-A", actor: "John Doe", initials: "JD", actionType: "Adjustment", amount: "+$150.00", timestamp: "Oct 24, 14:32:01" },
  { id: 2, run: "PR-2023-10-A", actor: "Sarah Wong", initials: "SW", actionType: "Override", amount: "+$5,000.00", timestamp: "Oct 24, 11:15:45", flagged: true },
  { id: 3, run: "PR-2023-10-A", actor: "System Auto", initials: "SYS", actionType: "Reversal", amount: "-$45.50", isNegative: true, timestamp: "Oct 23, 09:00:12" },
  { id: 4, run: "PR-2023-09-B", actor: "John Doe", initials: "JD", actionType: "Adjustment", amount: "+$200.00", timestamp: "Oct 15, 16:45:22" },
  { id: 5, run: "PR-2023-09-B", actor: "Mike Kline", initials: "MK", actionType: "Override", amount: "-$2,500.00", isNegative: true, timestamp: "Oct 14, 10:22:10", flagged: true },
];

function actionBadgeClass(type: PayrollRow["actionType"]) {
  if (type === "Override") return "bg-error-container text-error";
  if (type === "Reversal") return "bg-secondary-container text-on-secondary-container";
  return "bg-surface-container text-on-surface";
}

export default async function PayrollTrailPage() {
  await requirePermission("payroll:read");

  return (
    <>
      <div className="mb-gutter flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-on-surface">Payroll Audit Trail</h1>
          <p className="text-xs text-on-surface-variant">Monitoring fiscal changes and payroll execution anomalies.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-4 py-2 text-xs font-medium transition-colors hover:bg-surface-container-high">
            <Icon name="filter_list" className="text-sm" />
            Filter
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-on-primary shadow-sm transition-colors hover:bg-primary/90">
            <Icon name="download" className="text-sm" />
            Export Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="col-span-12 flex flex-col justify-between rounded-2xl bg-white p-6 shadow-ambient-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ambient-2 lg:col-span-4"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{stat.label}</span>
              <div
                className={`flex size-8 items-center justify-center rounded-full ${
                  "isAlert" in stat && stat.isAlert ? "bg-error-container text-error" : "bg-primary-container/20 text-primary"
                }`}
              >
                <Icon name={stat.icon} className="text-[18px]" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-on-surface">{stat.value}</span>
              {"trend" in stat && (
                <div className={`mt-1 flex items-center gap-1 text-[12px] font-medium ${stat.trendUp ? "text-tertiary" : "text-on-surface-variant"}`}>
                  {stat.trendUp && <Icon name="trending_up" className="text-[14px]" />}
                  {stat.trend}
                </div>
              )}
              {"note" in stat && <div className="mt-1 text-[12px] text-on-surface-variant">{stat.note}</div>}
            </div>
          </div>
        ))}

        <div className="col-span-12 flex flex-col overflow-hidden rounded-2xl bg-white shadow-ambient-1">
          <div className="flex items-center justify-between border-b border-surface-variant p-6">
            <h3 className="text-xl font-semibold text-on-surface">Recent Audit Logs</h3>
            <div className="flex gap-2">
              <button className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container">
                <Icon name="chevron_left" className="text-[18px]" />
              </button>
              <button className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container">
                <Icon name="chevron_right" className="text-[18px]" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-surface-variant bg-surface/50">
                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Run / Period</th>
                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Actor</th>
                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Action Type</th>
                  <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Amount Changed</th>
                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Timestamp</th>
                  <th className="px-6 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {ROWS.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-surface-variant transition-colors ${
                      row.flagged ? "bg-error-container/30 hover:bg-error-container/50" : "hover:bg-surface-bright"
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-on-surface">{row.run}</td>
                    <td className="px-6 py-4">
                      {/* Flex on a wrapper, not the <td> — a flex cell drops out
                          of the table layout and desyncs from its header. */}
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-secondary">
                          {row.initials}
                        </div>
                        <span className="min-w-0 truncate">{row.actor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase ${actionBadgeClass(row.actionType)}`}>
                        {row.actionType}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${row.flagged ? "font-bold text-error" : "text-on-surface"}`}>
                      {row.amount}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{row.timestamp}</td>
                    <td className="px-6 py-4 text-center">
                      <Icon
                        name={row.flagged ? "flag" : "check_circle"}
                        className={row.flagged ? "text-[18px] text-error" : "text-[18px] text-tertiary"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}