import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PaymentProof } from "@/components/features/accounts/payment-proof";
import { RecordPaymentForm } from "@/components/features/accounts/record-payment-form";
import { AgentPaymentDetailView } from "@/components/features/settings/agent-payment-detail";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { PaidNotice } from "@/components/features/accounts/paid-notice";
import { todayInNairobi } from "@/lib/accounts";
import { getPaymentRequest } from "@/lib/api/agent-money";
import { getAgentPaymentDetail } from "@/lib/api/settlement";
import { formatDateRange } from "@/lib/format";
import type { PaymentRequestItem } from "@/types/money-flow";

/**
 * One agent invoice, exactly as the Admin and the agent see it (every employee, what is added, every deduction),
 * with its payment: the form to pay it, or how it was paid and the proof.
 */
export default async function AccountsInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("invoice:read");

  const settlementId = Number((await params).id);
  if (!Number.isInteger(settlementId) || settlementId <= 0) notFound();

  let detail: Awaited<ReturnType<typeof getAgentPaymentDetail>>;
  try {
    detail = await getAgentPaymentDetail(settlementId);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    return <DataUnavailable title="Invoice" subject="This invoice" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  let payment: PaymentRequestItem | null = null;
  if (detail.paymentRequestId) {
    payment = await getPaymentRequest(detail.paymentRequestId).catch(() => null);
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Link
              href="/accounts/invoices"
              aria-label="Back to invoices"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            <span className="min-w-0 break-words">Invoice #{detail.settlementId}</span>
          </span>
        }
        description={`${formatDateRange(detail.periodStart, detail.periodEnd)} · ${detail.agentName}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/agent/documents/${detail.settlementId}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary-fixed"
            >
              <Icon name="print" className="text-[18px]" />
              Open / Print
            </a>
            <a
              href={`/api/agent/documents/${detail.settlementId}/invoice?download=1`}
              className="flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-container"
            >
              <Icon name="download" className="text-[18px]" />
              Download PDF
            </a>
          </div>
        }
      />

      {(await searchParams).paid === "1" ? <PaidNotice /> : null}

      <div className="flex flex-col gap-gutter">
        <BentoCard title="Payment" subtitle={payment ? `Payment #${payment.id}` : "Nothing to pay on this invoice"}>
          {payment ? (
            <div className="flex flex-col gap-4">
              <PaymentProof request={payment} payer="you" />
              {payment.status === "APPROVED" ? (
                <RecordPaymentForm
                  paymentRequestId={payment.id}
                  amount={payment.amount}
                  agentName={detail.agentName}
                  today={todayInNairobi()}
                  returnTo={`/accounts/invoices/${detail.settlementId}`}
                />
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">This invoice came to nothing payable after deductions.</p>
          )}
        </BentoCard>

        <AgentPaymentDetailView detail={detail} />
      </div>
    </>
  );
}
