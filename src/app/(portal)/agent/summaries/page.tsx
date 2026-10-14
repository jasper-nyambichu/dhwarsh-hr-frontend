import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getMyAgentSummaries } from "@/lib/api/agent-payroll";
import { formatDateRange, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import type { AgentPayrollSummaryResponse } from "@/types/agent-portal";

/** Payroll summaries — one row per payroll run that included the agent's staff. */
export default async function AgentSummariesPage() {
  await requirePermission("agentsummary:read:self");

  let summaries: AgentPayrollSummaryResponse[];
  try {
    summaries = await getMyAgentSummaries();
  } catch (error) {
    return (
      <DataUnavailable
        title="Payroll Summaries"
        subject="Your payroll summaries"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Payroll Summaries"
        description="What is payable to you for each payroll run, with the full breakdown."
      />

      <BentoCard title="Payroll Runs">
        {summaries.length === 0 ? (
          <EmptyState
            symbol="description"
            title="No payroll summaries yet"
            description="A summary appears here after a payroll run that includes your deployed staff."
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="py-4 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Period</th>
                  <th className="py-4 font-table-header text-table-header uppercase text-on-surface-variant">Staff</th>
                  <th className="py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Gross Salaries</th>
                  <th className="py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Service Charge</th>
                  <th className="py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Before VAT</th>
                  <th className="py-4 text-center font-table-header text-table-header uppercase text-on-surface-variant">VAT</th>
                  <th className="py-4 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Payable (KES)</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {summaries.map((s) => (
                  <tr key={s.id} className="group border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface-container-low/50">
                    <td className="py-4 pl-2 font-semibold transition-colors group-hover:text-primary">
                      <Link href={`/agent/summaries/${s.payrollRunId}`}>{formatDateRange(s.periodStart, s.periodEnd)}</Link>
                    </td>
                    <td className="py-4">{formatNumber(s.employeeCount)}</td>
                    <td className="py-4 text-right font-mono text-sm">{formatMoney(s.grossSalaries, { showCurrency: false })}</td>
                    <td className="py-4 text-right font-mono text-sm">{formatMoney(s.serviceCharge, { showCurrency: false })}</td>
                    <td className="py-4 text-right font-mono text-sm">{formatMoney(s.subtotalBeforeVat, { showCurrency: false })}</td>
                    <td className="py-4 text-center">
                      <span className="inline-block rounded-full bg-secondary-container/50 px-3 py-1 text-xs font-bold text-secondary">
                        {s.vatApplied ? formatPercent(s.vatRateUsed) : "None"}
                      </span>
                    </td>
                    <td className="py-4 pr-2 text-right font-mono text-sm font-semibold">{formatMoney(s.finalAmountPayable, { showCurrency: false })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>
    </>
  );
}