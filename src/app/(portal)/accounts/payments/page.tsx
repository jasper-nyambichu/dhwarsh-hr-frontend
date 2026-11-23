import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PAYMENT_METHOD_LABEL, evidenceHref, paymentSummary, receiptHref } from "@/components/features/accounts/payment-proof";
import { PaidNotice } from "@/components/features/accounts/paid-notice";
import { RecordPaymentForm } from "@/components/features/accounts/record-payment-form";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { loadAccountsPayments, todayInNairobi, type AccountsPayment } from "@/lib/accounts";
import { getBranches } from "@/lib/api/branch";
import { formatDate, formatDateRange } from "@/lib/format";
import { formatKes } from "@/lib/money-format";
import { first } from "@/lib/search-params";

const TABS = [
  { key: "to-pay", label: "To pay" },
  { key: "paid", label: "Paid" },
] as const;

/**
 * Accounts Office → Payments. "To pay": every agent invoice from the Admin's payroll runs, every advance and money
 * request the Admin approved, waiting to be paid, each with the form to record how it was paid (M-Pesa, cheque or
 * cash) and the proof. "Paid": every payment with its mode, references, proof and receipt (PDF), newest first.
 * Filter by branch: All branches, or the invoices covering one branch's employees.
 */
export default async function AccountsPaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("paymentrequest:pay");
  const params = await searchParams;
  const tab = first(params.tab) === "paid" ? "paid" : "to-pay";
  const justPaid = first(params.paid) === "1";
  const branchId = Number(first(params.branch));

  let data: Awaited<ReturnType<typeof loadAccountsPayments>>;
  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    [data, branches] = await Promise.all([loadAccountsPayments(), getBranches()]);
  } catch (error) {
    return <DataUnavailable title="Payments" subject="The payments" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  // One branch: the invoices covering that branch's employees. All branches: everything, advances included.
  const branch = branches.find((b) => b.id === branchId) ?? null;
  const toPay = branch ? data.toPay.filter((item) => item.branches.includes(branch.name)) : data.toPay;
  const owed = toPay.reduce((sum, item) => sum + item.request.amount, 0);
  const tabHref = (key: string, nextBranch: number | null) =>
    `/accounts/payments?tab=${key}${nextBranch ? `&branch=${nextBranch}` : ""}`;
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
          const count = item.key === "to-pay" ? toPay.length : data.paid.length;
          return (
            <Link
              key={item.key}
              href={tabHref(item.key, branch?.id ?? null)}
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
        <nav aria-label="Branch" className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-outline">Branch</span>
          {[{ id: null as number | null, name: "All branches" }, ...branches.map((b) => ({ id: b.id as number | null, name: b.name }))].map((option) => {
            const active = (option.id ?? null) === (branch?.id ?? null);
            return (
              <Link
                key={option.id ?? "all"}
                href={tabHref("to-pay", option.id)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-primary text-on-primary" : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {option.name}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {tab === "to-pay" ? (
        <BentoCard
          title={branch ? `Waiting to be paid · ${branch.name}` : "Waiting to be paid · All branches"}
          subtitle={`${toPay.length} payment(s) · ${formatKes(owed)} in total`}
        >
          {toPay.length === 0 ? (
            <EmptyState
              symbol="task_alt"
              title="All paid"
              description={branch ? `Nothing waiting for ${branch.name}'s employees.` : "When the Admin runs the payroll or approves an advance, it appears here to pay."}
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {toPay.map((item) => (
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
  const { request, invoice, branches } = item;
  const kind = invoice ? "Invoice" : request.advanceId ? "Advance" : "Money request";
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-xs text-outline">
          <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-semibold text-primary">{kind}</span>
          {request.agentName ?? `Agent #${request.agentId}`} · Payment #{request.id}
        </p>
        <p className="text-2xl font-bold tabular-nums text-on-surface">{formatKes(request.amount)}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{request.purpose}</p>
        <p className="mt-1 text-xs text-outline">
          {invoice ? `${formatDateRange(invoice.periodStart, invoice.periodEnd)} · ${invoice.employeeCount} employee(s) · ` : ""}
          Approved {formatDate(request.decidedAt)}
        </p>
        {branches.length > 0 ? <p className="mt-1 text-xs text-on-surface-variant">Branches: {branches.join(", ")}</p> : null}
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
              <a href={receiptHref(request.id, true)} className="font-semibold text-primary hover:underline">Receipt (PDF)</a>
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
                    <a href={receiptHref(request.id, true)} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                      <Icon name="receipt_long" className="text-[16px]" />
                      Receipt (PDF)
                    </a>
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
