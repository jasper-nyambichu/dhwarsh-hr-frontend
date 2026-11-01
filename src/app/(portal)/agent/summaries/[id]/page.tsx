import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getMyAgentSummaries, getAgentRunPayslips } from "@/lib/api/agent-payroll";
import { formatDateRange, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import type { AgentPayrollSummaryResponse } from "@/types/agent-portal";
import type { PayslipResponse } from "@/types/payroll";

/**
 * One payroll run's statement, laid out exactly as proposal section 6:
 * additions, advance recovery, subtotal before VAT, VAT, final payable.
 * The route `id` is the PAYROLL RUN id — one summary per agent per run.
 */

function Line({
  label,
  amount,
  negative = false,
}: {
  label: string;
  amount: number | null;
  negative?: boolean;
}) {
  const text =
    amount === null
      ? "—"
      : negative
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
  const runId = Number(id);
  if (!Number.isInteger(runId) || runId <= 0) notFound();

  let summaries: AgentPayrollSummaryResponse[];
  try {
    summaries = await getMyAgentSummaries();
  } catch (error) {
    return (
      <DataUnavailable
        title="Payroll Summary"
        subject="This payroll summary"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const s = summaries.find((item) => item.payrollRunId === runId);
  if (!s) notFound();

  const period = formatDateRange(s.periodStart, s.periodEnd);

       let payslips: PayslipResponse[] = [];
     try {
       payslips = await getAgentRunPayslips(s.payrollRunId, s.agentId);
     } catch {
       payslips = [];
     }

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
              href={`/api/agent/documents/${s.payrollRunId}/summary`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed"
            >
              <Icon name="description" className="text-[18px]" />
              Summary PDF
            </a>
            <Link
              href={`/agent/invoices/${s.payrollRunId}`}
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
          <MetricCard label="Subtotal Before VAT" value={formatMoney(s.subtotalBeforeVat)} icon="calculate" tone="primary" />
          <MetricCard label="Final Amount Payable" value={formatMoney(s.finalAmountPayable)} icon="payments" tone="primary" />
        </div>

        <BentoCard title="Payment Breakdown">
          <div className="flex flex-col">
            <Line label="Gross Salaries" amount={s.grossSalaries} />
            <Line label="Service Charge" amount={s.serviceCharge} />
            <Line label="SHIF" amount={s.shifTotal} />
            <Line label="NSSF" amount={s.nssfTotal} />
            <Line label="Housing Levy" amount={s.housingLevyTotal} />
            <Line label="PAYE" amount={s.payeTotal} />
            <Line label="Employee Loan Deductions" amount={s.employeeLoanDeductionsTotal} />
            <Line label="Less: Advance Recovery" amount={s.advanceRecoveryTotal} negative />

            <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3">
              <span className="font-bold text-on-surface">Subtotal Before VAT</span>
              <span className="font-mono text-sm font-bold tabular-nums">{formatMoney(s.subtotalBeforeVat, { showCurrency: false })}</span>
            </div>

            {s.vatApplied ? (
              <Line label={`VAT (${formatPercent(s.vatRateUsed)})`} amount={s.vatAmount} />
            ) : (
              <div className="flex items-center justify-between border-b border-outline-variant/20 py-3">
                <span className="font-body-md text-body-md text-on-surface-variant">VAT</span>
                <span className="text-sm text-on-surface-variant">Not applicable — not VAT-registered</span>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between rounded-lg border border-primary-fixed bg-primary-fixed-dim/20 px-4 py-4">
              <span className="font-page-title text-page-title text-primary">Final Amount Payable</span>
              <span className="font-page-title text-page-title font-bold text-primary">{formatMoney(s.finalAmountPayable)}</span>
            </div>
          </div>
        </BentoCard>

                   <BentoCard title="Employee statements" subtitle="The statement each employee receives">
             {payslips.length === 0 ? (
               <p className="text-sm text-on-surface-variant">No employee statements for this run.</p>
             ) : (
               <ul className="flex flex-col gap-2">
                 {payslips.map((payslip) => (
                   <li key={payslip.id}>
                     <Link
                       href={`/agent/payslips/${payslip.id}`}
                       className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-outline-variant/50 px-3 py-2 hover:bg-surface-container-low"
                     >
                       <span className="min-w-0 truncate font-semibold text-on-surface">
                         {payslip.employeeName ?? `Employee #${payslip.employeeId}`}
                       </span>
                       <span className="shrink-0 font-mono text-sm tabular-nums text-on-surface">
                         {formatMoney(payslip.netPay)}
                       </span>
                     </Link>
                   </li>
                 ))}
               </ul>
             )}
           </BentoCard>
      </div>
    </>
  );
}