import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { settlementSubtotal } from "@/lib/agent-format";
import { getMyAgentPayments } from "@/lib/api/settlement";
import { formatDateRange, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import type { AgentSettlementResponse } from "@/types/agent-portal";

/**
 * One period's statement: pay and statutory items, agent fee, VAT, then what comes off.
 * The route `id` is the agent payment (settlement) id.
 */

function Line({
  label,
  amount,
  negative = false,
}: {
  label: string;
  amount: number;
  negative?: boolean;
}) {
  const text = negative
    ? `(${formatMoney(amount, { showCurrency: false })})`
    : formatMoney(amount, { showCurrency: false });

  return (
    <div className="flex items-center justify-between border-b border-outline-variant/20 py-3 last:border-0">
      <span className="font-body-md text-body-md text-on-surface-variant">{label}</span>
      <span className={`font-mono text-sm tabular-nums ${negative ? "text-error" : "text-on-surface"}`}>{text}</span>
    </div>
  );
}

export default async function AgentSummaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("agentsummary:read:self");

  const { id } = await params;
  const settlementId = Number(id);
  if (!Number.isInteger(settlementId) || settlementId <= 0) notFound();

  let summaries: AgentSettlementResponse[];
  try {
    summaries = await getMyAgentPayments();
  } catch (error) {
    return (
      <DataUnavailable
        title="Payment Summary"
        subject="This payment summary"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const s = summaries.find((item) => item.id === settlementId);
  if (!s) notFound();

  const period = formatDateRange(s.periodStart, s.periodEnd);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/agent/summaries"
              aria-label="Back to summaries"
              className="flex size-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            {`Summary: ${period}`}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-3">
            <a
              href={`/api/agent/documents/${s.id}/statement`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed"
            >
              <Icon name="description" className="text-[18px]" />
              Summary PDF
            </a>
            <Link
              href={`/agent/invoices/${s.id}`}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
            >
              <Icon name="receipt_long" className="text-[18px]" />
              View Invoice
            </Link>
          </div>
        }
      />

      <div className="mx-auto flex max-w-4xl flex-col gap-gutter">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard label="Employees" value={formatNumber(s.employeeCount)} icon="group" tone="primary" />
          <MetricCard label="Days Worked" value={formatNumber(s.daysWorkedTotal)} icon="date_range" tone="primary" />
          <MetricCard label="Amount Payable" value={formatMoney(s.amountPayable)} icon="payments" tone="primary" />
        </div>

        <BentoCard title="For the Government" subtitle="Included in the amount you receive. You deduct these, with SHIF and any other statutory amounts, and pay them to the government.">
          <Line label="PAYE, NSSF and NITA" amount={s.payeTotal + s.nssfTotal + s.nitaTotal} />
        </BentoCard>

        <BentoCard title="Payment Breakdown">
          <div className="flex flex-col">
            <Line label="Pay for days worked" amount={s.daysPay} />
            <Line label="PAYE" amount={s.payeTotal} />
            <Line label="NSSF" amount={s.nssfTotal} />
            <Line label="NITA" amount={s.nitaTotal} />
            <Line label="Agent fee" amount={s.agentFee} />

            <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3">
              <span className="font-bold text-on-surface">Subtotal Before VAT</span>
              <span className="font-mono text-sm font-bold tabular-nums">{formatMoney(settlementSubtotal(s), { showCurrency: false })}</span>
            </div>

            <Line label={`VAT (${formatPercent(s.vatRateUsed)})`} amount={s.vatAmount} />
            <Line label="Less: Loans" amount={s.loanTotal} negative />
            <Line label="Less: Damages" amount={s.damageTotal} negative />
            <Line label="Less: Advances" amount={s.advanceRecovered} negative />

            <div className="mt-2 flex items-center justify-between rounded-lg border border-primary-fixed bg-primary-fixed-dim/20 px-4 py-4">
              <span className="font-page-title text-page-title text-primary">Amount Payable</span>
              <span className="font-page-title text-page-title font-bold text-primary">{formatMoney(s.amountPayable)}</span>
            </div>
          </div>
        </BentoCard>
      </div>
    </>
  );
}
