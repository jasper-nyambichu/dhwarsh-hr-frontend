import { ApiError } from "@/app/lib/api-error";
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getMyAgentPayments } from "@/lib/api/settlement";
import { formatDateRange, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import type { AgentSettlementResponse } from "@/types/agent-portal";

/** Payment summaries — what the agent is paid for each period. */
export default async function AgentSummariesPage() {
  await requirePermission("agentsummary:read:self");

  let summaries: AgentSettlementResponse[];
  try {
    summaries = await getMyAgentPayments();
  } catch (error) {
    return (
      <DataUnavailable
        title="Payment Summaries"
        subject="Your payment summaries"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Payment Summaries"
        description="What is payable to you for each period, with the full breakdown."
      />

      <BentoCard title="Periods">
        {summaries.length === 0 ? (
          <EmptyState
            symbol="description"
            title="No payment summaries yet"
            description="A summary appears here once the Administrator calculates a period that includes your staff."
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="py-4 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Period</th>
                  <th className="py-4 font-table-header text-table-header uppercase text-on-surface-variant">Employees</th>
                  <th className="py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Days Pay</th>
                  <th className="py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Agent Fee</th>
                  <th className="py-4 text-center font-table-header text-table-header uppercase text-on-surface-variant">VAT</th>
                  <th className="py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Advances</th>
                  <th className="py-4 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Payable (KES)</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {summaries.map((s) => (
                  <tr key={s.id} className="group border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface-container-low/50">
                    <td className="py-4 pl-2 font-semibold transition-colors group-hover:text-primary">
                      <Link href={`/agent/summaries/${s.id}`}>{formatDateRange(s.periodStart, s.periodEnd)}</Link>
                    </td>
                    <td className="py-4">{formatNumber(s.employeeCount)}</td>
                    <td className="py-4 text-right font-mono text-sm">{formatMoney(s.daysPay, { showCurrency: false })}</td>
                    <td className="py-4 text-right font-mono text-sm">{formatMoney(s.agentFee, { showCurrency: false })}</td>
                    <td className="py-4 text-center">
                      <span className="inline-block rounded-full bg-secondary-container/50 px-3 py-1 text-xs font-bold text-secondary">
                        {formatPercent(s.vatRateUsed)}
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono text-sm">{formatMoney(s.advanceRecovered, { showCurrency: false })}</td>
                    <td className="py-4 pr-2 text-right font-mono text-sm font-semibold">{formatMoney(s.amountPayable, { showCurrency: false })}</td>
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
