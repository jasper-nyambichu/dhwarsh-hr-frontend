import Image from "next/image";
import Link from "next/link";

import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatDateRange, formatMoney, formatNumber } from "@/lib/format";
import type { EmployeePayslip } from "@/types/payslip";

/**
 * Payslips, shared by the Admin, Branch Manager and Agent portals so all three read the same figures.
 * Each shows what the formula says the employee gets beside what the agent recorded paying, so a
 * payment that never happened stands out.
 */

export function PayslipList({
  payslips,
  basePath,
  description,
}: {
  payslips: EmployeePayslip[];
  basePath: string;
  description: string;
}) {
  const due = payslips.reduce((sum, payslip) => sum + payslip.amountDue, 0);
  const recorded = payslips.reduce((sum, payslip) => sum + payslip.amountRecorded, 0);
  const notRecorded = payslips.reduce((sum, payslip) => sum + payslip.amountNotRecorded, 0);
  const header = "pb-3 font-table-header text-table-header uppercase text-outline";

  return (
    <>
      <PageHeader title="Payslips" description={description} />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Paid to Agents for Employees" value={formatMoney(due)} icon="payments" tone="primary" hint="From the payment formula" />
        <MetricCard label="Recorded by Agents" value={formatMoney(recorded)} icon="receipt_long" tone="primary" hint="M-Pesa payments recorded" />
        <MetricCard label="Not Yet Recorded" value={formatMoney(notRecorded)} icon="pending_actions" tone={notRecorded > 0 ? "amber" : "primary"} accent={notRecorded > 0} />
      </div>

      <BentoCard className="mt-gutter" title="All payslips" subtitle={`${formatNumber(payslips.length)} payslip${payslips.length === 1 ? "" : "s"}, newest period first`}>
        {payslips.length === 0 ? (
          <EmptyState symbol="receipt_long" title="No payslips yet" description="Payslips appear here once the Administrator calculates agent payments for a period." />
        ) : (
          <>
          {/* Phones: one card per payslip */}
          <ul className="flex flex-col gap-3 md:hidden">
            {payslips.map((payslip) => (
              <li key={payslip.id} className="rounded-lg border border-outline-variant/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`${basePath}/${payslip.id}`} className="min-w-0">
                    <span className="block break-words font-semibold text-primary">{payslip.employeeName}</span>
                    <span className="block font-mono text-[11px] text-outline">{payslip.employeeNumber}</span>
                    <span className="block text-xs text-on-surface-variant">{formatDateRange(payslip.periodStart, payslip.periodEnd)}</span>
                  </Link>
                  <PdfLink payslipId={payslip.id} label={`Download payslip of ${payslip.employeeName}`} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-on-surface-variant">Paid to agent</dt>
                    <dd className="font-semibold tabular-nums text-on-surface">{formatMoney(payslip.amountDue)}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Deductions</dt>
                    <dd className="tabular-nums text-error">{formatMoney(payslip.loan + payslip.damage)}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Branch</dt>
                    <dd className="break-words text-on-surface">{payslip.branchName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Not recorded</dt>
                    <dd className={`tabular-nums ${payslip.amountNotRecorded > 0 ? "font-semibold text-amber-main" : "text-on-surface"}`}>
                      {formatMoney(payslip.amountNotRecorded)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          {/* Tablets and desktops: a table */}
          <div className="hidden w-full overflow-x-auto md:block">
            <table className="data-table w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr>
                  <th className={`${header} pl-2`}>Employee</th>
                  <th className={header}>Period</th>
                  <th className={header}>Branch</th>
                  <th className={header}>Agent</th>
                  <th className={`${header} text-right`}>Paid to Agent</th>
                  <th className={`${header} text-right`}>Recorded</th>
                  <th className={`${header} text-right`}>Deductions</th>
                  <th className={`${header} text-right`}>Not Recorded</th>
                  <th className={`${header} pr-2 text-right`}>PDF</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {payslips.map((payslip) => (
                  <tr key={payslip.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface">
                    <td className="py-3 pl-2">
                      <Link href={`${basePath}/${payslip.id}`} className="block font-semibold text-primary hover:underline">
                        {payslip.employeeName}
                      </Link>
                      <span className="block font-mono text-[11px] text-outline">{payslip.employeeNumber}</span>
                    </td>
                    <td className="py-3 text-on-surface-variant">{formatDateRange(payslip.periodStart, payslip.periodEnd)}</td>
                    <td className="py-3 text-on-surface-variant">{payslip.branchName ?? "—"}</td>
                    <td className="py-3 text-on-surface-variant">{payslip.agentName ?? "—"}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(payslip.amountDue, { showCurrency: false })}</td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(payslip.amountRecorded, { showCurrency: false })}</td>
                    <td className="py-3 text-right tabular-nums text-error">
                      {formatMoney(payslip.loan + payslip.damage, { showCurrency: false })}
                    </td>
                    <td className={`py-3 text-right tabular-nums ${payslip.amountNotRecorded > 0 ? "font-semibold text-amber-main" : "text-on-surface-variant"}`}>
                      {formatMoney(payslip.amountNotRecorded, { showCurrency: false })}
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <PdfLink payslipId={payslip.id} label={`Download payslip of ${payslip.employeeName}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </BentoCard>
    </>
  );
}

function Line({ label, amount, negative = false }: { label: string; amount: number; negative?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-outline-variant/20 py-3 last:border-0">
      <span className="min-w-0 break-words font-body-md text-body-md text-on-surface-variant">{label}</span>
      <span className={`shrink-0 font-mono text-sm tabular-nums ${negative ? "text-error" : "text-on-surface"}`}>
        {negative ? `(${formatMoney(amount, { showCurrency: false })})` : formatMoney(amount, { showCurrency: false })}
      </span>
    </div>
  );
}

function Subtotal({ label, amount, negative = false }: { label: string; amount: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="font-semibold text-on-surface">{label}</span>
      <span className={`shrink-0 font-mono text-sm font-bold tabular-nums ${negative ? "text-error" : "text-on-surface"}`}>
        {negative ? `(${formatMoney(amount, { showCurrency: false })})` : formatMoney(amount, { showCurrency: false })}
      </span>
    </div>
  );
}

/** Downloads the payslip PDF, which itemises every loan and damage taken off. */
function PdfLink({ payslipId, label }: { payslipId: number; label: string }) {
  return (
    <a
      href={`/api/payslips/${payslipId}?download=1`}
      aria-label={label}
      title="Download PDF"
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-primary transition-colors hover:bg-surface-container-low"
    >
      <Icon name="download" className="text-[20px]" />
    </a>
  );
}

export function PayslipDetail({
  payslip,
  backHref,
  hasLogo,
}: {
  payslip: EmployeePayslip;
  backHref: string;
  hasLogo: boolean;
}) {
  const income = payslip.pay + payslip.paye + payslip.nssf + payslip.nita;
  const deductions = payslip.loan + payslip.damage;
  const loanItems = payslip.loanItems ?? [];
  const damageItems = payslip.damageItems ?? [];

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href={backHref}
              aria-label="Back to payslips"
              className="flex size-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            {payslip.employeeName}
          </span>
        }
        description={`${payslip.employeeNumber} · ${formatDateRange(payslip.periodStart, payslip.periodEnd)}`}
        actions={
          <a
            href={`/api/payslips/${payslip.id}?download=1`}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
          >
            <Icon name="download" className="text-[18px]" />
            Download PDF
          </a>
        }
      />

      <div className="mx-auto flex max-w-4xl flex-col gap-gutter">
        <BentoCard
          title="Payslip"
          subtitle={`${payslip.branchName ?? "—"} · Agent: ${payslip.agentName ?? "—"}`}
          action={
            hasLogo ? (
              <Image src="/api/company/logo" alt="Company logo" width={120} height={48} unoptimized className="h-12 w-auto object-contain" />
            ) : undefined
          }
        >
          <div className="flex flex-col">
            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-outline">Income</p>
            <Line label={`${formatNumber(payslip.daysWorked)} days × ${formatMoney(payslip.dailyRate)}`} amount={payslip.pay} />
            <Line label="PAYE" amount={payslip.paye} />
            <Line label="NSSF" amount={payslip.nssf} />
            <Line label="NITA" amount={payslip.nita} />
            <Subtotal label="Total income" amount={income} />

            <p className="pt-4 text-xs font-semibold uppercase tracking-wide text-outline">Deductions</p>
            {loanItems.length > 0 ? (
              loanItems.map((item) => <Line key={`loan-${item.id}`} label={item.label} amount={item.amount} negative />)
            ) : (
              <Line label="Loans" amount={payslip.loan} negative />
            )}
            {damageItems.length > 0 ? (
              damageItems.map((item) => (
                <Line
                  key={`damage-${item.id}`}
                  label={item.date ? `${item.label} (${formatDate(item.date)})` : item.label}
                  amount={item.amount}
                  negative
                />
              ))
            ) : (
              <Line label="Damages" amount={payslip.damage} negative />
            )}
            <Subtotal label="Total deductions" amount={deductions} negative />

            <p className="mt-3 rounded-lg bg-surface-container-low px-3 py-2 font-mono text-xs text-on-surface-variant">
              {formatMoney(income, { showCurrency: false })} − {formatMoney(deductions, { showCurrency: false })} ={" "}
              {formatMoney(payslip.amountDue, { showCurrency: false })}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary-fixed bg-primary-fixed-dim/20 px-4 py-4">
              <span className="text-base font-semibold text-primary sm:font-page-title sm:text-page-title">Amount Paid to the Agent for This Employee</span>
              <span className="text-lg font-bold tabular-nums text-primary sm:font-page-title sm:text-page-title">{formatMoney(payslip.amountDue)}</span>
            </div>
          </div>
        </BentoCard>

        <BentoCard title="Payments recorded by the agent" subtitle="Each M-Pesa payment the agent recorded for this employee and period">
          {payslip.payments.length === 0 ? (
            <p className="py-2 text-sm text-on-surface-variant">No payments recorded yet.</p>
          ) : (
            <ul className="flex flex-col">
              {payslip.payments.map((payment) => (
                <li key={payment.mpesaCode} className="flex items-center justify-between gap-3 border-b border-outline-variant/20 py-3 last:border-0">
                  <span className="min-w-0">
                    <span className="block font-mono text-sm text-on-surface">{payment.mpesaCode}</span>
                    <span className="block text-xs text-outline">{formatDate(payment.paidOn)}</span>
                  </span>
                  <span className="shrink-0 font-mono text-sm tabular-nums">{formatMoney(payment.amount, { showCurrency: false })}</span>
                </li>
              ))}
            </ul>
          )}

          <div className={`mt-3 flex items-center justify-between rounded-lg px-4 py-3 ${payslip.amountNotRecorded > 0 ? "bg-amber-main/10" : "bg-surface-container-low"}`}>
            <span className="font-semibold text-on-surface">Not yet recorded</span>
            <span className="font-mono text-sm font-bold tabular-nums">{formatMoney(payslip.amountNotRecorded)}</span>
          </div>
        </BentoCard>
      </div>
    </>
  );
}
