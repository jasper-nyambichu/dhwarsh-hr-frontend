import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { MetricCard } from "@/components/shared/metric-card";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { formatMoneyCompact, formatNumber, initials } from "@/lib/format";

/**
 * Agent (external labour supplier) dashboard.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/dashboard/agent` endpoint yet. Replace with
 * `await api.get<AgentDashboard>("/dashboard/agent")` when it lands.
 * ─────────────────────────────────────────────────────────────────────────
 */

const KPI = {
  deployedStaff: 86,
  outstandingInvoices: 1_900_000,
  advancesApproved: 4,
} as const;

const DEPLOYMENT_TREND: readonly BarDatum[] = [
  { label: "Jan", value: 40, tooltip: "40 staff" },
  { label: "Feb", value: 60, tooltip: "60 staff" },
  { label: "Mar", value: 50, tooltip: "50 staff" },
  { label: "Apr", value: 80, tooltip: "80 staff" },
  { label: "May", value: 70, tooltip: "70 staff" },
  { label: "Jun", value: 95, tooltip: "95 staff" },
];

const INVOICE_STATUS = [
  { label: "Paid", value: 70, color: "var(--color-tertiary-container)" },
  { label: "Pending", value: 20, color: "var(--color-primary-container)" },
  { label: "Overdue", value: 10, color: "var(--color-error)" },
] as const;

const RECENT_INVOICES = [
  { id: 1, invoice: "INV-0231", period: "May 2026", staff: 12, amount: 450_000, issued: "01 Jun 2026", status: "Overdue" as const },
  { id: 2, invoice: "INV-0230", period: "Apr 2026", staff: 15, amount: 520_000, issued: "01 May 2026", status: "Paid" as const },
  { id: 3, invoice: "INV-0229", period: "Mar 2026", staff: 10, amount: 380_000, issued: "01 Apr 2026", status: "Paid" as const },
  { id: 4, invoice: "INV-0228", period: "Feb 2026", staff: 14, amount: 490_000, issued: "01 Mar 2026", status: "Paid" as const },
];

const INVOICE_CHIP: Record<(typeof RECENT_INVOICES)[number]["status"], string> = {
  Paid: "bg-tertiary-container/10 text-tertiary-container",
  Overdue: "bg-error/10 text-error",
};

const RECENT_PLACEMENTS = [
  { id: 1, name: "Peter Njuguna", branch: "Nairobi CBD" },
  { id: 2, name: "Grace Wambui", branch: "Mombasa Port" },
  { id: 3, name: "David Kiprotich", branch: "Kisumu Branch" },
  { id: 4, name: "Sarah Anyango", branch: "Nairobi West" },
] as const;

const PLACEMENT_BY_BRANCH = [
  { label: "Nairobi", value: 45, color: "var(--color-primary)" },
  { label: "Mombasa", value: 30, color: "var(--color-primary-container)" },
  { label: "Kisumu", value: 25, color: "var(--color-primary-fixed-dim)" },
] as const;

export default async function AgentDashboardPage() {
  await requirePermission("agent:read:self");

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* ───────────────────────────────── main column ─────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard label="Deployed Staff" value={formatNumber(KPI.deployedStaff)} icon="group" tone="primary" />
          <MetricCard
            label="Outstanding Invoices"
            value={formatMoneyCompact(KPI.outstandingInvoices)}
            icon="receipt_long"
            tone="primary"
          />
          <MetricCard label="Advances Approved" value={formatNumber(KPI.advancesApproved)} icon="payments" tone="primary" />
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <BentoCard
            title="Deployment Trend"
            subtitle="Last 6 months"
            className="flex min-h-64 flex-col"
            bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2"
          >
            <BarChart data={DEPLOYMENT_TREND} max={100} axisLabels={["100", "50", "0"]} tone="primary" />
          </BentoCard>

          <BentoCard title="Invoice Status" className="flex min-h-64 flex-col" bodyClassName="flex flex-1 flex-col justify-center">
            <DonutChart segments={INVOICE_STATUS} size={140} legend="value" centerLabel="Total" />
          </BentoCard>
        </div>

        <BentoCard
          title="Recent Invoices"
          action={
            <Link href="/agent/invoices" className="text-[10px] text-primary-container hover:underline">
              View All
            </Link>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Invoice No</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Period</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Staff</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Amount</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Issued</th>
                  <th className="pb-3 pr-2 font-table-header text-table-header uppercase text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {RECENT_INVOICES.map((inv) => (
                  <tr key={inv.id} className="group transition-colors">
                    <td className="py-3 pl-2 font-medium text-primary">
                      <Link href={`/agent/invoices/${inv.id}`}>{inv.invoice}</Link>
                    </td>
                    <td className="py-3 text-on-surface-variant">{inv.period}</td>
                    <td className="py-3 tabular-nums text-on-surface-variant">{formatNumber(inv.staff)}</td>
                    <td className="py-3 text-right font-semibold tabular-nums text-on-surface">
                      {formatMoneyCompact(inv.amount, { showCurrency: false })}
                    </td>
                    <td className="py-3 text-on-surface-variant">{inv.issued}</td>
                    <td className="py-3 pr-2">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${INVOICE_CHIP[inv.status]}`}>
                        {inv.status}
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
        <SegmentStrip
          segments={[
            { label: "Active", value: formatNumber(86) },
            { label: "Ended", value: formatNumber(12) },
            { label: "Pending", value: formatNumber(5), tone: "warning" },
          ]}
        />

        <AlertSpotlight
          eyebrow="Attention Required"
          title="Invoice INV-0231 is 14 days overdue"
          message="Please follow up with the client."
          cta="View Invoice"
          href="/agent/invoices/1"
        />

        <BentoCard title="Recent Placements">
          <ul className="flex flex-col gap-1">
            {RECENT_PLACEMENTS.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/agent/staff`}
                  className="group -mx-2 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-container"
                >
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                  >
                    {initials(p.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body-md text-body-md font-semibold text-on-surface group-hover:text-primary-container">
                      {p.name}
                    </span>
                    <span className="block truncate text-[11px] text-on-surface-variant">{p.branch}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/agent/staff"
            className="mt-4 block rounded-lg border border-outline-variant py-2 text-center font-body-md text-body-md font-medium text-primary transition-colors hover:bg-surface-container-low"
          >
            View All Staff
          </Link>
        </BentoCard>

        <BentoCard title="Placement by Branch">
          <DonutChart segments={PLACEMENT_BY_BRANCH} size={140} legend="value" />
        </BentoCard>
      </div>
    </div>
  );
}