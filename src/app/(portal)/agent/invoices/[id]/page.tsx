import { ApiError } from "@/app/lib/api-error";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";
import { AgentPaymentDetailView } from "@/components/features/settings/agent-payment-detail";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { PaymentProof } from "@/components/features/accounts/payment-proof";
import { BentoCard } from "@/components/shared/bento-card";
import { getMyPaymentRequests } from "@/lib/api/agent-money";
import { getOrganisationBranding } from "@/lib/api/organisation";
import { getAgentPaymentDetail } from "@/lib/api/settlement";
import { formatDateRange } from "@/lib/format";

/**
 * The agent's invoice for one payment, sent by the Admin when the payroll was run: every employee's salary, days,
 * pay, loans, damages and net pay; what is added (PAYE, NSSF, NITA, agent fee, VAT); and every deduction, each
 * advance with the date it was asked for and approved. These are the very figures on the Admin's side. The PDF is
 * the printable copy. The route `id` is the payment (settlement) id; the server refuses another agent's.
 */
export default async function AgentInvoiceDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoice:read:self");

  const settlementId = Number((await params).id);
  if (!Number.isInteger(settlementId) || settlementId <= 0) notFound();

  let detail: Awaited<ReturnType<typeof getAgentPaymentDetail>>;
  try {
    detail = await getAgentPaymentDetail(settlementId);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    return <DataUnavailable title="Invoice" subject="This invoice" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const [requests, branding] = await Promise.all([getMyPaymentRequests().catch(() => []), getOrganisationBranding()]);
  const payment = detail.paymentRequestId ? requests.find((request) => request.id === detail.paymentRequestId) ?? null : null;

  return (
    <>
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Link
              href="/agent/invoices"
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
      {payment ? (
        <div className="mb-gutter">
          <BentoCard title="Payment to you" subtitle={`Payment #${payment.id}`}>
            <PaymentProof request={payment} payer={branding.accountsOffice ? "the Accounts Office" : "the Administrator"} />
          </BentoCard>
        </div>
      ) : null}
      <AgentPaymentDetailView detail={detail} />
    </>
  );
}
