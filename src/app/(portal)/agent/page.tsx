import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoney, formatNumber } from "@/lib/format";

/**
 * Agent monthly summaries — payroll & commission history.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/agent-summaries` list endpoint exists yet.
 * ─────────────────────────────────────────────────────────────────────────
 */

type SummaryStatus = "DRAFT" | "FINALIZED";

type SummaryRow = {
  id: number;
  period: string;
  staffCount: number;
  daysWorked: number;
  gross: number;
  commission: number;
  status: SummaryStatus;
};

const SUMMARIES: readonly SummaryRow[] = [
  { id: 1, period: "August 2026", staffCount: 145, daysWorked: 3_120, gross: 4_850_000, commission: 242_500, status: "DRAFT" },
  { id: 2, period: "July 2026", staffCount: 142, daysWorked: 3_050, gross: 4_720_000, commission: 236_000, status: "FINALIZED" },
  { id: 3, period: "June 2026", staffCount: 138, daysWorked: 2_980, gross: 4_550_000, commission: 227_500, status: "FINALIZED" },
  { id: 4, period: "May 2026", staffCount: 135, daysWorked: 2_890, gross: 4_410_000, commission: 220_500, status: "FINALIZED" },
  { id: 5, period: "April 2026", staffCount: 130, daysWorked: 2_750, gross: 4_200_000, commission: 210_000, status: "FINALIZED" },
  { id: 6, period: "March 2026", staffCount: 128, daysWorked: 2_800, gross: 4_280_000, commission: 214_000, status: "FINALIZED" },
];

const STATUS_CHIP: Record<SummaryStatus, string> = {
  DRAFT: "bg-secondary-container/50 text-secondary",
  FINALIZED: "bg-tertiary-fixed text-on-tertiary-fixed",
};

export default async function AgentSummariesPage() {
  await requirePermission("agent:read:self");

  return (
    <>
      <PageHeader
        title="Monthly Summaries"
        description="Review monthly aggregated data for your assigned staff."
        actions={
          <div className="flex gap-3">
            <button type="button" className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-4 py-2 font-body-md text-body-md font-semibold text-primary shadow-sm transition-colors hover:bg-surface-container-high">
              <Icon name="filter_list" className="text-[18px]" />
              Filter
            </button>
            <button type="button" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-md transition-colors hover:bg-primary-container">
              <Icon name="download" className="text-[18px]" />
              Export Report
            </button>
          </div>
        }
      />

      <BentoCard
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-orange/10 text-orange">
              <Icon name="calendar_month" />
            </span>
            Monthly Aggregates
          </span>
        }
        action={
          <select className="cursor-pointer rounded-md border-none bg-surface-container-low py-1.5 pl-3 pr-8 font-body-md text-body-md font-medium text-on-surface focus:ring-0">
            <option>2026</option>
            <option>2025</option>
          </select>
        }
      >
        <div className="w-full overflow-x-auto">
          <table className="data-table w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="py-4 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Period</th>
                <th className="py-4 font-table-header text-table-header uppercase text-on-surface-variant">Staff Count</th>
                <th className="py-4 font-table-header text-table-header uppercase text-on-surface-variant">Days Worked</th>
                <th className="py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Gross (KES)</th>
                <th className="py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Commission (KES)</th>
                <th className="py-4 pr-2 text-center font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              {SUMMARIES.map((row) => (
                <tr key={row.id} className="group border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface-container-low/50">
                  <td className="py-4 pl-2 font-semibold transition-colors group-hover:text-primary">
                    <Link href={`/agent/summaries/${row.id}`}>{row.period}</Link>
                  </td>
                  <td className="py-4">{formatNumber(row.staffCount)}</td>
                  <td className="py-4">{formatNumber(row.daysWorked)}</td>
                  <td className="py-4 text-right font-mono text-sm">{formatMoney(row.gross, { showCurrency: false })}</td>
                  <td className="py-4 text-right font-mono text-sm font-medium text-orange">{formatMoney(row.commission, { showCurrency: false })}</td>
                  <td className="py-4 pr-2 text-center">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${STATUS_CHIP[row.status]}`}>
                      {row.status === "DRAFT" ? "Draft" : "Finalized"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>
    </>
  );
}