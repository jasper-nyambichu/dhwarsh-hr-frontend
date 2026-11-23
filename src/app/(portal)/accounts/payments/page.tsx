import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PAYMENT_METHOD_LABEL, evidenceHref, paymentSummary } from "@/components/features/accounts/payment-proof";
import { PaidNotice } from "@/components/features/accounts/paid-notice";
import { RecordPaymentForm } from "@/components/features/accounts/record-payment-form";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { loadAccountsPayments, todayInNairobi, type AccountsPayment } from "@/lib/accounts";
import { formatDate, formatDateRange } from "@/lib/format";
import { formatKes } from "@/lib/money-format";
import { first } from "@/lib/search-params";

const TABS = [
  { key: "to-pay", label: "To pay" },
  { key: "paid", label: "Paid" },
] as const;

/**
 * Accounts Office → Payments. "To pay": every agent invoice from the Admin's payroll runs (and any money the Admin
 * approved for an agent) waiting to be paid, each with the form to record how it was paid and the proof.
 * "Paid": the record of every payment, with its mode, references and proof, newest first.
 */
export default async function AccountsPaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("paymentrequest:pay");
  const params = await searchParams;
  const tab = first(params.tab) === "paid" ? "paid" : "to-pay";
  const justPaid = first(params.paid) === "1";

  let data: Awaited<ReturnType<typeof loadAccountsPayments>>;
  try {
    data = await loadAccountsPayments();
  } catch (error) {
    return <DataUnavailable title="Payments" subject="The payments" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const owed = data.toPay.reduce((sum, item) => sum + item.request.amount, 0);
  const today = todayInNairobi();

  return (
    <>
      <PageHeader
        title="Payments"
        description="Pay each agent invoice and record how it was paid, with the proof. The Admin and the agent are told."
        pill={<CountPill label={`${data.toPay.length} to pay`} />}
      />

      {justPaid ? <PaidNotice /> : null}

      <nav aria-label="Payments" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => {
          const active = item.key === tab;
          const count = item.key === "to-pay" ? data.toPay.length : data.paid.length;
          return (
            <Link
              key={item.key}
              href={`/accounts/payments?tab=${item.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
                active ? "bg-primary text-on-primary" : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {item.label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-on-primary/20 text-on-primary" : item.key === "to-pay" && count > 0 ? "bg-error/10 text-error" : "bg-surface-container text-on-surface-variant"}`}>
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {tab === "to-pay" ? (
        <BentoCard title="Waiting to be paid" subtitle={`${data.toPay.length} payment(s) · ${formatKes(owed)} in total`}>
          {data.toPay.length === 0 ? (
            <EmptyState symbol="task_alt" title="All paid" description="When the Admin runs the payroll, each agent's invoice appears here to pay." />
          ) : (
            <ul className="flex flex-col gap-4">
              {data.toPay.map((item) => (
                <li key={item.request.id} className="rounded-lg border border-outline-variant/50 p-4">
                  <PaymentHeading item={item} />
                  <div className="mt-4 border-t border-outline-variant/30 pt-4">
                    <RecordPaymentForm
                      paymentRequestId={item.request.id}
                      amount={item.request.amount}
                      agentName={item.request.agentName ?? `Agent #${item.request.agentId}`}
                      today={today}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </BentoCard>
      ) : (
        <BentoCard title="Paid" subtitle="Every payment, with how it was paid and its proof">
          {data.paid.length === 0 ? (
            <EmptyState symbol="receipt_long" title="No payments yet" description="Payments you record appear here." />
          ) : (
            <PaidTable items={data.paid} />
          )}
        </BentoCard>
      )}
    </>
  );
}

function PaymentHeading({ item }: { item: AccountsPayment }) {
  const { request, invoice } = item;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-outline">
          {request.agentName ?? `Agent #${request.agentId}`} · Payment #{request.id}
        </p>
        <p className="text-2xl font-bold tabular-nums text-on-surface">{formatKes(request.amount)}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{request.purpose}</p>
        <p className="mt-1 text-xs text-outline">
          {invoice ? `${formatDateRange(invoice.periodStart, invoice.periodEnd)} · ${invoice.employeeCount} employee(s) · ` : ""}
          Approved {formatDate(request.decidedAt)}
        </p>
      </div>
      {invoice ? (
        <Link
          href={`/accounts/invoices/${invoice.id}`}
          className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary-fixed"
        >
          <Icon name="description" className="text-[18px]" />
          View invoice
        </Link>
      ) : null}
    </div>
  );
}

function PaidTable({ items }: { items: AccountsPayment[] }) {
  const TH = "pb-3 font-table-header text-table-header uppercase text-on-surface-variant";
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {items.map(({ request, invoice }) => (
          <li key={request.id} className="rounded-lg border border-outline-variant/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate font-semibold text-on-surface">{request.agentName ?? `Agent #${request.agentId}`}</p>
              <p className="shrink-0 font-bold tabular-nums text-on-surface">{formatKes(request.amount)}</p>
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">{paymentSummary(request)}</p>
            <p className="mt-1 text-xs text-outline">
              Paid {formatDate(request.paidOn ?? request.releasedAt)} · by {request.releasedByName ?? "—"}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {invoice ? <Link href={`/accounts/invoices/${invoice.id}`} className="font-semibold text-primary hover:underline">Invoice #{invoice.id}</Link> : null}
              {request.hasEvidence ? <a href={evidenceHref(request.id)} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Proof</a> : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="data-table w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr>
              <th className={`${TH} pl-2`}>Paid on</th>
              <th className={TH}>Agent</th>
              <th className={`${TH} text-right`}>Amount</th>
              <th className={`${TH} pl-4`}>Mode</th>
              <th className={TH}>Reference</th>
              <th className={TH}>Recorded by</th>
              <th className={`${TH} pr-2`}>Documents</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {items.map(({ request, invoice }) => (
              <tr key={request.id} className="border-b border-outline-variant/20 align-top last:border-0">
                <td className="py-3 pl-2 text-on-surface-variant">{formatDate(request.paidOn ?? request.releasedAt)}</td>
                <td className="py-3 font-semibold">{request.agentName ?? `Agent #${request.agentId}`}</td>
                <td className="py-3 text-right font-semibold tabular-nums">{formatKes(request.amount)}</td>
                <td className="py-3 pl-4">{request.paymentMethod ? PAYMENT_METHOD_LABEL[request.paymentMethod] : "Released"}</td>
                <td className="py-3">
                  <span className={request.paymentMethod === "MANUAL" ? "text-sm" : "font-mono text-sm"}>
                    {request.paymentMethod === "CHEQUE" ? `${request.chequeNumber} · ${request.chequeBank}` : request.releaseReference ?? "—"}
                  </span>
                  {request.paymentMethod === "CHEQUE" && request.chequeDate ? (
                    <span className="block text-xs text-outline">Dated {formatDate(request.chequeDate)}</span>
                  ) : null}
                  {request.paymentNote ? <span className="block text-xs text-outline">{request.paymentNote}</span> : null}
                </td>
                <td className="py-3 text-on-surface-variant">{request.releasedByName ?? "—"}</td>
                <td className="py-3 pr-2">
                  <span className="flex flex-col gap-1 text-sm">
                    {invoice ? <Link href={`/accounts/invoices/${invoice.id}`} className="font-semibold text-primary hover:underline">Invoice #{invoice.id}</Link> : null}
                    {request.hasEvidence ? (
                      <a href={evidenceHref(request.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                        <Icon name="attach_file" className="text-[16px]" />
                        Proof
                      </a>
                    ) : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
