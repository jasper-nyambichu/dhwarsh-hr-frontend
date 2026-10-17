import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AuditLogTable } from "@/components/features/audit/audit-log-table";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getAuditLogsForEntity } from "@/lib/api/audit";
import { getPayrollRun, getRunAgentSummaries, getRunPayslips } from "@/lib/api/payroll";
import { formatDateRange, formatMoney, formatMoneyCompact, formatNumber, humanizeEnum } from "@/lib/format";
import { RUN_STATUS_CHIP, runScopeLabel } from "@/lib/payroll-format";
import { statutoryTotals } from "@/lib/payroll-stats";

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md border border-outline-variant/40 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary-fixed">
      {label}
    </a>
  );
}

/** One payroll run, audited: totals, statutory amounts, every payslip, agent payments, and who ran it. */
export default async function AuditPayrollRunPage({ params }: { params: Promise<{ runId: string }> }) {
  await requirePermission("payroll:read");

  const { runId: rawRunId } = await params;
  const runId = Number(rawRunId);
  if (!Number.isInteger(runId) || runId <= 0) notFound();

  let data: {
    run: Awaited<ReturnType<typeof getPayrollRun>>;
    payslips: Awaited<ReturnType<typeof getRunPayslips>>;
    summaries: Awaited<ReturnType<typeof getRunAgentSummaries>>;
  };
  try {
    const [run, payslips, summaries] = await Promise.all([getPayrollRun(runId), getRunPayslips(runId), getRunAgentSummaries(runId)]);
    data = { run, payslips, summaries };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return (
      <DataUnavailable title="Payroll Run" subject="This payroll run" reason={error instanceof Error ? error.message : undefined} />
    );
  }

  const { run, payslips, summaries } = data;
  const trail = await getAuditLogsForEntity("PayrollRun", runId, 10).catch(() => null);
  const statutory = statutoryTotals(payslips);
  const gross = run.totalGrossPayroll ?? 0;
  const net = run.totalNetPayroll ?? 0;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Link href="/audit/payroll" aria-label="Back to payroll" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            {`Payroll Run — ${formatDateRange(run.periodStart, run.periodEnd)}`}
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${RUN_STATUS_CHIP[run.status]}`}>{humanizeEnum(run.status)}</span>
          </span>
        }
        description={`Run #${run.id} · ${runScopeLabel(run)}`}
        actions={<DocLink href={`/api/reports/payroll-register?runId=${run.id}`} label="Payroll Register PDF" />}
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        <MetricCard label="Employees Paid" value={formatNumber(run.payslipCount)} icon="group" tone="primary" />
        <MetricCard label="Gross Payroll" value={formatMoneyCompact(run.totalGrossPayroll)} icon="account_balance_wallet" tone="primary" />
        <MetricCard label="Total Deductions" value={formatMoneyCompact(gross - net)} icon="gavel" tone="error" />
        <MetricCard label="Net Payroll" value={formatMoneyCompact(run.totalNetPayroll)} icon="payments" tone="primary" />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <BentoCard title="Statutory Totals" subtitle="Deducted and due for remittance">
          <div className="flex flex-col">
            {[
              ["PAYE", statutory.paye],
              ["NSSF", statutory.nssf],
              ["SHIF", statutory.shif],
              ["Housing Levy", statutory.housingLevy],
            ].map(([label, amount]) => (
              <div key={label as string} className="flex justify-between border-b border-outline-variant/20 py-2.5 text-sm last:border-0">
                <span className="text-on-surface-variant">{label}</span>
                <span className="tabular-nums text-on-surface">{formatMoney(amount as number)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between rounded-lg bg-surface-container-low px-3 py-2.5 text-sm font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(statutory.total)}</span>
            </div>
          </div>
        </BentoCard>

        <BentoCard title="Who ran it" subtitle="From the audit trail">
          {!trail || trail.content.length === 0 ? (
            <p className="py-2 text-sm text-on-surface-variant">
              No audit entry is linked to this run. Runs made before audit ids were recorded cannot be matched.
            </p>
          ) : (
            <AuditLogTable logs={trail.content} detailBasePath="/audit/logs" />
          )}
        </BentoCard>
      </div>

      {summaries.length > 0 ? (
        <BentoCard className="mt-gutter" title="Agent Payments">
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Agent</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Before VAT</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">VAT</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Payable</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Documents</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {summaries.map((summary) => {
                  const base = `/api/payroll/documents/${run.id}/${summary.agentId}`;
                  return (
                    <tr key={summary.id} className="border-b border-outline-variant/20 last:border-0">
                      <td className="py-3 pl-2 font-semibold">{summary.agentName ?? `Agent #${summary.agentId}`}</td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(summary.subtotalBeforeVat, { showCurrency: false })}</td>
                      <td className="py-3 text-right tabular-nums text-on-surface-variant">{summary.vatApplied ? formatMoney(summary.vatAmount, { showCurrency: false }) : "—"}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(summary.finalAmountPayable, { showCurrency: false })}</td>
                      <td className="py-3 pr-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <DocLink href={`${base}/summary`} label="Summary" />
                          <DocLink href={`${base}/voucher`} label="Voucher" />
                          <DocLink href={`${base}/invoice`} label="Invoice" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </BentoCard>
      ) : null}

      <BentoCard className="mt-gutter" title="Payslips">
        <div className="w-full overflow-x-auto">
          <table className="data-table w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr>
                <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Gross</th>
                <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Deductions</th>
                <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Net</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface">
              {payslips.map((payslip) => (
                <tr key={payslip.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface">
                  <td className="py-3 pl-2">
                    <Link href={`/audit/payroll/payslips/${payslip.id}`} className="block">
                      <span className="block font-semibold text-primary">{payslip.employeeName ?? "—"}</span>
                      <span className="block text-xs text-outline">{payslip.employeeNumber ?? ""}</span>
                    </Link>
                  </td>
                  <td className="py-3 text-right tabular-nums">{formatMoney(payslip.grossPay, { showCurrency: false })}</td>
                  <td className="py-3 text-right tabular-nums text-error">{formatMoney(payslip.grossPay - payslip.netPay, { showCurrency: false })}</td>
                  <td className="py-3 pr-2 text-right font-semibold tabular-nums">{formatMoney(payslip.netPay, { showCurrency: false })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>
    </>
  );
}