import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";
import { ApiError } from "@/app/lib/api-error";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { hasPermission } from "@/config/roles";
import { getPayrollRun, getRunAgentSummaries, getRunPayslips } from "@/lib/api/payroll";
import { formatDateRange, formatMoney, formatMoneyCompact, formatNumber, humanizeEnum, initials } from "@/lib/format";
import { RUN_STATUS_CHIP, runScopeLabel } from "@/lib/payroll-format";

/** One payroll run: totals, every payslip, and each agent's amount payable. */
export default async function PayrollRunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const session = await requirePermission("payroll:read");

  const { runId: rawRunId } = await params;
  const runId = Number(rawRunId);
  if (!Number.isInteger(runId) || runId <= 0) notFound();

  let data: {
    run: Awaited<ReturnType<typeof getPayrollRun>>;
    payslips: Awaited<ReturnType<typeof getRunPayslips>>;
    summaries: Awaited<ReturnType<typeof getRunAgentSummaries>>;
  };

  try {
    const [run, payslips, summaries] = await Promise.all([
      getPayrollRun(runId),
      getRunPayslips(runId),
      getRunAgentSummaries(runId),
    ]);
    data = { run, payslips, summaries };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return (
      <DataUnavailable
        title="Payroll Run"
        subject="This payroll run"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const { run, payslips, summaries } = data;
  const canReport = hasPermission(session.role, "report:read");
  const gross = run.totalGrossPayroll ?? 0;
  const net = run.totalNetPayroll ?? 0;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Link href="/payroll/runs" aria-label="Back to runs" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            {`Payroll Run — ${formatDateRange(run.periodStart, run.periodEnd)}`}
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${RUN_STATUS_CHIP[run.status]}`}>
              {humanizeEnum(run.status)}
            </span>
          </span>
        }
        description={`Run #${run.id} · ${runScopeLabel(run)}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {canReport ? (
              <a
                href={`/api/reports/payroll-register?runId=${run.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed"
              >
                <Icon name="list_alt" className="text-[18px]" />
                Payroll Register
              </a>
            ) : null}
            <Link
              href={`/payroll/documents?run=${run.id}`}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
            >
              <Icon name="description" className="text-[18px]" />
              Documents
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        <MetricCard label="Employees Paid" value={formatNumber(run.payslipCount)} icon="group" tone="primary" />
        <MetricCard label="Gross Payroll" value={formatMoneyCompact(run.totalGrossPayroll)} icon="account_balance_wallet" tone="primary" />
        <MetricCard label="Total Deductions" value={formatMoneyCompact(gross - net)} icon="gavel" tone="error" />
        <MetricCard label="Net Payroll" value={formatMoneyCompact(run.totalNetPayroll)} icon="payments" tone="primary" />
      </div>

      <BentoCard className="mt-gutter" title="Payslips">
        {payslips.length === 0 ? (
          <EmptyState symbol="receipt_long" title="No payslips" />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Gross (KES)</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Deductions (KES)</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Net (KES)</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {payslips.map((payslip) => (
                  <tr key={payslip.id} className="border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface">
                    <td className="py-3 pl-2">
                      <Link href={`/payroll/payslips/${payslip.id}`} className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {initials(payslip.employeeName)}
                        </span>
                        <span>
                          <span className="block font-semibold">{payslip.employeeName ?? "—"}</span>
                          <span className="block text-xs text-outline">{payslip.employeeNumber ?? ""}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(payslip.grossPay, { showCurrency: false })}</td>
                    <td className="py-3 text-right tabular-nums text-error">{formatMoney(payslip.grossPay - payslip.netPay, { showCurrency: false })}</td>
                    <td className="py-3 pr-2 text-right font-semibold tabular-nums text-primary">{formatMoney(payslip.netPay, { showCurrency: false })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>

      {summaries.length > 0 ? (
        <BentoCard className="mt-gutter" title="Agent Payments" subtitle="Amount payable to each labour agent for this run">
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Agent</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Staff</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Before VAT (KES)</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">VAT (KES)</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Payable (KES)</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {summaries.map((summary) => (
                  <tr key={summary.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="py-3 pl-2 font-semibold">{summary.agentName ?? `Agent #${summary.agentId}`}</td>
                    <td className="py-3 text-right tabular-nums">{formatNumber(summary.employeeCount)}</td>
                    <td className="py-3 text-right tabular-nums">{formatMoney(summary.subtotalBeforeVat, { showCurrency: false })}</td>
                    <td className="py-3 text-right tabular-nums text-on-surface-variant">
                      {summary.vatApplied ? formatMoney(summary.vatAmount, { showCurrency: false }) : "—"}
                    </td>
                    <td className="py-3 pr-2 text-right font-semibold tabular-nums text-primary">{formatMoney(summary.finalAmountPayable, { showCurrency: false })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      ) : null}
    </>
  );
}