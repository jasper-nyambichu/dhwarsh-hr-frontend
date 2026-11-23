import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getPaymentRequests } from "@/lib/api/agent-money";
import { getAgentPayments } from "@/lib/api/settlement";
import { formatDateRange } from "@/lib/format";
import { formatKes } from "@/lib/money-format";

/**
 * Accounts Office → Invoices: every agent invoice the Admin's payroll runs produced, newest first, with whether it
 * has been paid. The same invoices the agents receive.
 */
export default async function AccountsInvoicesPage() {
  await requirePermission("invoice:read");

  let data: { invoices: Awaited<ReturnType<typeof getAgentPayments>>; requests: Awaited<ReturnType<typeof getPaymentRequests>> };
  try {
    const [invoices, requests] = await Promise.all([getAgentPayments(), getPaymentRequests()]);
    data = { invoices, requests };
  } catch (error) {
    return <DataUnavailable title="Invoices" subject="The agent invoices" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const status = new Map(data.requests.map((r) => [r.id, r.status]));
  const TH = "pb-3 font-table-header text-table-header uppercase text-on-surface-variant";

  return (
    <>
      <PageHeader title="Invoices" description="Every agent invoice from the Admin's payroll runs. Open one to see it line by line, print it or pay it." />
      <BentoCard title="Agent invoices" subtitle={`${data.invoices.length} invoice(s)`}>
        {data.invoices.length === 0 ? (
          <EmptyState symbol="description" title="No invoices yet" description="Invoices appear here when the Admin runs the payroll." />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className={`${TH} pl-2`}>Invoice</th>
                  <th className={TH}>Agent</th>
                  <th className={TH}>Period</th>
                  <th className={`${TH} text-right`}>Staff</th>
                  <th className={`${TH} text-right`}>To agent</th>
                  <th className={`${TH} pl-4 pr-2`}>Payment</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {data.invoices.map((invoice) => {
                  const state = invoice.paymentRequestId ? status.get(invoice.paymentRequestId) : null;
                  return (
                    <tr key={invoice.id} className="border-b border-outline-variant/20 last:border-0">
                      <td className="py-3 pl-2">
                        <Link href={`/accounts/invoices/${invoice.id}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                          <Icon name="description" className="text-[16px]" />#{invoice.id}
                        </Link>
                      </td>
                      <td className="py-3 font-semibold">{invoice.agentName ?? `Agent #${invoice.agentId}`}</td>
                      <td className="py-3 text-on-surface-variant">{formatDateRange(invoice.periodStart, invoice.periodEnd)}</td>
                      <td className="py-3 text-right tabular-nums">{invoice.employeeCount}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatKes(invoice.amountPayable)}</td>
                      <td className="py-3 pl-4 pr-2">
                        {state === "RELEASED" ? (
                          <span className="inline-flex rounded-full bg-tertiary-container/20 px-2.5 py-0.5 text-xs font-semibold text-tertiary">Paid</span>
                        ) : state === "APPROVED" ? (
                          <span className="inline-flex rounded-full bg-amber-main/15 px-2.5 py-0.5 text-xs font-semibold text-amber-main">To pay</span>
                        ) : (
                          <span className="text-xs text-outline">Nothing to pay</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>
    </>
  );
}
