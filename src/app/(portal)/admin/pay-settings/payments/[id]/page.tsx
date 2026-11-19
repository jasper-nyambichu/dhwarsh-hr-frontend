import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AgentPaymentDetailView } from "@/components/features/settings/agent-payment-detail";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getAgentPaymentDetail } from "@/lib/api/settlement";
import { formatDateRange } from "@/lib/format";

/**
 * One payment that was run, line by line: the very figures the agent sees on their invoice (both come from the
 * same server record), so the Admin and the agent can go through it together.
 */
export default async function AdminAgentPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("agentpayment:run");

  const settlementId = Number((await params).id);
  if (!Number.isInteger(settlementId) || settlementId <= 0) notFound();

  let detail: Awaited<ReturnType<typeof getAgentPaymentDetail>>;
  try {
    detail = await getAgentPaymentDetail(settlementId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <DataUnavailable title="Agent payment" subject="This payment" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/pay-settings"
              aria-label="Back to pay rates and payments"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            <span className="min-w-0 break-words">{detail.agentName}</span>
          </span>
        }
        description={`Payment #${detail.settlementId} · ${formatDateRange(detail.periodStart, detail.periodEnd)} · the same figures as the agent's invoice`}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/agent/documents/${detail.settlementId}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary-fixed"
            >
              <Icon name="print" className="text-[18px]" />
              Invoice PDF
            </a>
            <a
              href={`/api/agent/documents/${detail.settlementId}/statement`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            >
              <Icon name="description" className="text-[18px]" />
              Statement PDF
            </a>
          </div>
        }
      />
      <AgentPaymentDetailView detail={detail} />
    </>
  );
}
