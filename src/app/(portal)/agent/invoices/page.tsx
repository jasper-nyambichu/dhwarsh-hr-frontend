import { ApiError } from "@/app/lib/api-error";
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { settlementSubtotal } from "@/lib/agent-format";
import { getMyAgentPayments } from "@/lib/api/settlement";
import { formatDateRange, formatMoney, formatPercent } from "@/lib/format";
import type { AgentSettlementResponse } from "@/types/agent-portal";

/**
 * Invoices — one per agent payment, generated automatically by the backend. It
 * does not number invoices or track paid/overdue status, so none is shown; the
 * payment id is the reference.
 */
export default async function AgentInvoicesPage() {
  await requirePermission("invoice:read:self");

  let summaries: AgentSettlementResponse[];
  try {
    summaries = await getMyAgentPayments();
  } catch (error) {
    return (
      <DataUnavailable
        title="Invoices"
        subject="Your invoices"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        description="An invoice is generated for every period you are paid for."
      />

      <BentoCard title="Invoice History">
        {summaries.length === 0 ? (
          <EmptyState symbol="receipt_long" title="No invoices yet" description="Invoices appear here once the Administrator calculates a period that includes your staff." />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="py-3 pl-2 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Reference</th>
                  <th className="py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Period</th>
                  <th className="py-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Before VAT</th>
                  <th className="py-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">VAT</th>
                  <th className="py-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Total (KES)</th>
                  <th className="py-3 pr-2 text-center font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">PDF</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface">
                {summaries.map((s) => (
                  <tr key={s.id} className="border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface">
                    <td className="py-4 pl-2 font-semibold text-primary">
                      <Link href={`/agent/invoices/${s.id}`}>#{s.id}</Link>
                    </td>
                    <td className="py-4 text-on-surface-variant">{formatDateRange(s.periodStart, s.periodEnd)}</td>
                    <td className="py-4 text-right tabular-nums">{formatMoney(settlementSubtotal(s), { showCurrency: false })}</td>
                    <td className="py-4 text-right tabular-nums text-on-surface-variant">
                      {`${formatMoney(s.vatAmount, { showCurrency: false })} (${formatPercent(s.vatRateUsed)})`}
                    </td>
                    <td className="py-4 text-right font-semibold tabular-nums">{formatMoney(s.amountPayable, { showCurrency: false })}</td>
                    <td className="py-4 pr-2 text-center">
                      <a
                        href={`/api/agent/documents/${s.id}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open invoice PDF ${s.id}`}
                        className="inline-flex text-on-surface-variant hover:text-primary"
                      >
                        <Icon name="download" className="text-[20px]" />
                      </a>
                    </td>
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