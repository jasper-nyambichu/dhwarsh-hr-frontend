import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatMoneyCompact, formatNumber } from "@/lib/format";
import type { PayrollRun, PayrollRunStatus } from "@/types";

/**
 * Payroll runs list.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.PayrollRun`, plus a `scope`
 * display label the list view needs as a projection over
 * scopeBranchIds/scopeAgentIds/scopeDepartmentIds. Swap for
 * `await api.get<Paginated<PayrollRun>>("/payroll/runs")` when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

type RunRow = PayrollRun & { period: string; scopeLabel: string; employees: number };

const RUNS: readonly RunRow[] = [
  { id: 1, period: "Oct 2026", scopeLabel: "Nairobi CBD", employees: 142, periodStart: "2026-10-01", periodEnd: "2026-10-31", scopeBranchIds: "1", scopeAgentIds: null, scopeDepartmentIds: null, status: "APPROVED", totalGrossPayroll: null, totalNetPayroll: 4_250_000, initiatedByUserId: null, createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 2, period: "Oct 2026", scopeLabel: "Mombasa Branch", employees: 86, periodStart: "2026-10-01", periodEnd: "2026-10-31", scopeBranchIds: "2", scopeAgentIds: null, scopeDepartmentIds: null, status: "PROCESSING", totalGrossPayroll: null, totalNetPayroll: 2_100_500, initiatedByUserId: null, createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 3, period: "Oct 2026", scopeLabel: "Agents (All)", employees: 312, periodStart: "2026-10-01", periodEnd: "2026-10-31", scopeBranchIds: null, scopeAgentIds: "ALL", scopeDepartmentIds: null, status: "DRAFT", totalGrossPayroll: null, totalNetPayroll: 1_850_000, initiatedByUserId: null, createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 4, period: "Sep 2026", scopeLabel: "All Branches", employees: 420, periodStart: "2026-09-01", periodEnd: "2026-09-30", scopeBranchIds: "ALL", scopeAgentIds: null, scopeDepartmentIds: null, status: "COMPLETED", totalGrossPayroll: null, totalNetPayroll: 12_450_000, initiatedByUserId: null, createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
];

const STATUS_TABS: readonly FilterTab[] = [
  { label: "All Runs" },
  { label: "Draft", value: "DRAFT" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Approved", value: "APPROVED" },
];

const STATUS_CHIP: Record<PayrollRunStatus, string> = {
  DRAFT: "bg-surface-variant text-on-surface-variant border border-outline-variant/50",
  PROCESSING: "bg-primary-container/10 text-primary-container border border-primary-container/20",
  COMPLETED: "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20",
  APPROVED: "bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20",
  FAILED: "bg-error/10 text-error border border-error/20",
  CANCELLED: "bg-surface-variant text-on-surface-variant border border-outline-variant/50",
};

const RUNS_BY_SCOPE = [
  { label: "Branches", value: 45, color: "var(--color-primary)" },
  { label: "Agents", value: 35, color: "var(--color-secondary-container)" },
  { label: "Departments", value: 20, color: "var(--color-tertiary-container)" },
] as const;

export default async function PayrollRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("payroll:run");
  const { status } = await searchParams;

  const rows = status ? RUNS.filter((r) => r.status === status) : RUNS;

  return (
    <>
      <PageHeader
        title="Payroll Runs"
        description="Manage and track all payroll processing cycles."
        actions={
          <Link
            href="/payroll/runs/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md text-body-md font-medium text-on-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-on-primary-fixed-variant"
          >
            <Icon name="add" className="text-sm" />
            New Run
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <FilterTabs tabs={STATUS_TABS} active={status} param="status" basePath="/payroll/runs" />

          <BentoCard
            title="Recent Runs"
            action={
              <button
                type="button"
                className="flex items-center gap-1 font-body-md text-body-md text-primary hover:text-on-primary-fixed-variant"
              >
                <Icon name="filter_list" className="text-[18px]" />
                Filter
              </button>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Period</th>
                    <th className="pb-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Branch/Scope</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Emps</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Net (KES)</th>
                    <th className="pb-3 text-center font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Action</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {rows.map((run) => (
                    <tr key={run.id} className="group transition-colors">
                      <td className="py-4 pl-2 font-medium text-on-surface">
                        <Link href={`/payroll/runs/${run.id}`}>{run.period}</Link>
                      </td>
                      <td className="py-4 text-on-surface-variant">{run.scopeLabel}</td>
                      <td className="py-4 text-right tabular-nums text-on-surface-variant">{formatNumber(run.employees)}</td>
                      <td className="py-4 text-right font-medium tabular-nums text-on-surface">
                        {formatMoneyCompact(run.totalNetPayroll ?? 0, { showCurrency: false })}
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${STATUS_CHIP[run.status]}`}>
                          {run.status.charAt(0) + run.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <button className="text-on-surface-variant opacity-0 transition-colors hover:text-primary group-hover:opacity-100">
                          <Icon name="more_horiz" className="text-[20px]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <BentoCard title="Runs by Scope">
            <DonutChart segments={RUNS_BY_SCOPE} size={180} legend="value" centerLabel="Total Runs" />
          </BentoCard>
        </div>
      </div>
    </>
  );
}