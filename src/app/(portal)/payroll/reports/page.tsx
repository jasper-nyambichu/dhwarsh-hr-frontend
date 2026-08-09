import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoneyCompact } from "@/lib/format";
import type { BarDatum } from "@/components/shared/bar-chart";
import { BarChart } from "@/components/shared/bar-chart";

/**
 * Payroll reports catalogue.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER. Metrics and the cost trend/deductions chart have no
 * endpoint yet; swap for `await api.get<PayrollReportSummary>(...)` when
 * available. Report cards trigger generation only, no download logic wired.
 * ─────────────────────────────────────────────────────────────────────────
 */

const KPI = {
  totalGross: 14_250_000,
  totalNet: 10_840_000,
  statutoryRemitted: 3_410_000,
  avgCostPerEmployee: 124_500,
} as const;

const COST_TREND: readonly BarDatum[] = [
  { label: "May", value: 10.5, tooltip: "KES 10.5M" },
  { label: "Jun", value: 11.2, tooltip: "KES 11.2M" },
  { label: "Jul", value: 12.0, tooltip: "KES 12.0M" },
  { label: "Aug", value: 11.8, tooltip: "KES 11.8M" },
  { label: "Sep", value: 12.8, tooltip: "KES 12.8M" },
  { label: "Oct", value: 14.2, tooltip: "KES 14.2M" },
];

const DEDUCTIONS_BREAKDOWN = [
  { label: "PAYE", value: 55, color: "var(--color-primary)" },
  { label: "NSSF", value: 20, color: "var(--color-amber-main)" },
  { label: "SHIF", value: 15, color: "var(--color-green-main)" },
  { label: "Housing Levy", value: 10, color: "var(--color-error)" },
] as const;

type ReportCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
  urgent?: boolean;
};

const REPORT_CATALOGUE: readonly ReportCard[] = [
  { id: "register", title: "Payroll Register", description: "Complete breakdown of all earnings, deductions, and net pay for the period.", icon: "list_alt" },
  { id: "bank-advice", title: "Bank Advice", description: "Disbursement instructions formatted for commercial bank batch processing.", icon: "account_balance" },
  { id: "paye", title: "PAYE Return", description: "Income tax statutory filing data formatted for KRA iTax portal upload.", icon: "receipt_long", urgent: true },
  { id: "nssf", title: "NSSF Return", description: "Social security contributions reporting for both employer and employee tiers.", icon: "shield" },
  { id: "shif", title: "SHIF Return", description: "Health insurance fund statutory filing based on gross earnings parameters.", icon: "health_and_safety" },
  { id: "housing-levy", title: "Housing Levy Return", description: "Affordable housing statutory compliance report for gross monthly pay deductions.", icon: "maps_home_work" },
];

export default async function PayrollReportsPage() {
  await requirePermission("payroll:read");

  return (
    <>
      <PageHeader
        title="Payroll Reports Overview"
        description="Financial period: October 2026"
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-3 py-1.5 font-body-md text-body-md font-medium text-primary transition-colors hover:bg-surface-container-low"
          >
            <Icon name="download" className="text-[18px]" />
            Export All
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        <MetricCard label="Total Gross" value={formatMoneyCompact(KPI.totalGross)} icon="account_balance_wallet" tone="primary" hint="+5% vs last month" />
        <MetricCard label="Total Net" value={formatMoneyCompact(KPI.totalNet)} icon="payments" tone="primary" hint="+4% vs last month" />
        <MetricCard label="Statutory Remitted" value={formatMoneyCompact(KPI.statutoryRemitted)} icon="gavel" tone="error" hint="+2% vs last month" />
        <MetricCard label="Avg Cost/Employee" value={formatMoneyCompact(KPI.avgCostPerEmployee)} icon="person" hint="-1% vs last month" />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter md:grid-cols-2">
        <BentoCard
          title="Cost Trend (6 Months)"
          action={<Icon name="more_vert" className="text-[20px] text-outline" />}
          className="flex h-[300px] flex-col"
          bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2"
        >
          <BarChart data={COST_TREND} max={15} axisLabels={["15M", "10M", "5M", "0"]} tone="primary" />
        </BentoCard>

        <BentoCard
          title="Deductions Breakdown"
          action={<Icon name="more_vert" className="text-[20px] text-outline" />}
          className="flex h-[300px] flex-col"
          bodyClassName="flex flex-1 flex-col justify-center"
        >
          <DonutChart segments={DEDUCTIONS_BREAKDOWN} size={160} legend="value" centerLabel="Total" />
        </BentoCard>
      </div>

      <h3 className="mb-4 mt-gutter text-lg font-bold text-on-surface">Statutory &amp; Management Reports</h3>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        {REPORT_CATALOGUE.map((report) => (
          <div
            key={report.id}
            className="group relative flex flex-col gap-3 rounded-card border border-transparent bg-surface-container-lowest p-5 shadow-ambient-1 transition-colors hover:border-primary-fixed-dim hover:shadow-ambient-2"
          >
            {report.urgent && (
              <span className="absolute right-0 top-0 flex size-8 items-start justify-end rounded-bl-full bg-error-container p-1">
                <Icon name="priority_high" className="text-[12px] text-error" />
              </span>
            )}
            <div className="relative z-10 flex items-start gap-3">
              <span
                className={`rounded-lg p-2 text-on-surface transition-colors ${
                  report.urgent
                    ? "bg-surface-container-high group-hover:bg-error group-hover:text-on-error"
                    : "bg-surface-container-high group-hover:bg-primary-container group-hover:text-on-primary-container"
                }`}
              >
                <Icon name={report.icon} />
              </span>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-on-surface">{report.title}</h4>
                <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{report.description}</p>
              </div>
            </div>
            <div className="mt-auto flex justify-end border-t border-surface-variant pt-3">
              <button
                type="button"
                className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-surface-container-low"
              >
                Generate
                <Icon name="arrow_forward" className="text-[14px]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}