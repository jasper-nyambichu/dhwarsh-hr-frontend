import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { Icon } from "@/components/ui/icon";
import { getMyAgent } from "@/lib/api/agent";
import { settlementSubtotal } from "@/lib/agent-format";
import { getMyAgentPayments } from "@/lib/api/settlement";
import { formatDateRange, formatMoney, formatPercent } from "@/lib/format";

/**
 * On-screen invoice for one agent payment. Mirrors the backend PDF. The PDF is the
 * authoritative document — this view is for reading, and the buttons open it
 * in the browser's viewer where printing is one click.
 * The route `id` is the agent payment (settlement) id.
 */
export default async function AgentInvoiceDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoice:read:self");

  const { id } = await params;
  const settlementId = Number(id);
  if (!Number.isInteger(settlementId) || settlementId <= 0) notFound();

  let agent: Awaited<ReturnType<typeof getMyAgent>>;
  let summaries: Awaited<ReturnType<typeof getMyAgentPayments>>;
  try {
    [agent, summaries] = await Promise.all([getMyAgent(), getMyAgentPayments()]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Invoice"
        subject="This invoice"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const s = summaries.find((item) => item.id === settlementId);
  if (!s) notFound();

  return (
    <div className="bg-surface-container-low py-10">
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4">
        <Link href="/agent/invoices" className="flex items-center gap-2 font-body-md text-body-md text-primary transition-colors hover:text-primary-container">
          <Icon name="arrow_back" />
          Back to Invoices
        </Link>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <a
            href={`/api/agent/documents/${s.id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-label-rail text-label-rail uppercase tracking-wider text-primary transition-colors hover:bg-primary-fixed"
          >
            <Icon name="print" />
            Open / Print
          </a>
          <a
            href={`/api/agent/documents/${s.id}/invoice?download=1`}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-rail text-label-rail uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:bg-primary-container"
          >
            <Icon name="download" />
            Download PDF
          </a>
        </div>
      </div>

      <div className="mx-auto flex min-h-[200mm] w-full max-w-[210mm] flex-col rounded-card bg-white p-10 shadow-ambient-2 lg:p-16">
        <div className="mb-12 flex flex-wrap items-start justify-between gap-6 border-b border-surface-variant pb-8">
          <div>
            <h1 className="mb-2 text-4xl font-light text-primary">INVOICE</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Reference: <span className="font-semibold text-on-surface">#{s.id}</span>
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Period: <span className="font-semibold text-on-surface">{formatDateRange(s.periodStart, s.periodEnd)}</span>
            </p>
          </div>
          <div className="space-y-1 text-right font-body-md text-body-md text-on-surface-variant">
            <h2 className="font-page-title text-page-title text-orange">{agent.name}</h2>
            {agent.address ? <p>{agent.address}</p> : null}
            <p>KRA PIN: {agent.kraPin ?? "—"}</p>
            {agent.email ? <p>{agent.email}</p> : null}
          </div>
        </div>

        <div className="mb-12 flex justify-end">
          <div className="w-full sm:w-1/2">
            <div className="flex justify-between border-b border-surface-variant py-2 font-body-md text-body-md">
              <span className="text-on-surface-variant">Amount Before VAT</span>
              <span className="font-semibold text-on-surface">{formatMoney(settlementSubtotal(s), { showCurrency: false })}</span>
            </div>
            <div className="flex justify-between border-b border-surface-variant py-2 font-body-md text-body-md">
              <span className="text-on-surface-variant">{`VAT (${formatPercent(s.vatRateUsed)})`}</span>
              <span className="font-semibold text-on-surface">{formatMoney(s.vatAmount, { showCurrency: false })}</span>
            </div>
            <div className="flex justify-between border-b border-surface-variant py-2 font-body-md text-body-md">
              <span className="text-on-surface-variant">Less: Loans and Damages</span>
              <span className="font-semibold text-on-surface">({formatMoney(s.loanTotal + s.damageTotal, { showCurrency: false })})</span>
            </div>
            <div className="flex justify-between border-b border-surface-variant py-2 font-body-md text-body-md">
              <span className="text-on-surface-variant">Less: Advances</span>
              <span className="font-semibold text-on-surface">({formatMoney(s.advanceRecovered, { showCurrency: false })})</span>
            </div>
            <div className="mt-2 flex justify-between rounded-lg border border-primary-fixed bg-primary-fixed-dim/20 px-4 py-4">
              <span className="font-page-title text-page-title text-primary">Total Amount Due</span>
              <span className="font-page-title text-page-title font-bold text-primary">{formatMoney(s.amountPayable)}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-surface-variant pt-6 text-center text-[11px] text-on-surface-variant">
          VAT charged at the rate in force when this payment was calculated.
        </div>
      </div>
    </div>
  );
}