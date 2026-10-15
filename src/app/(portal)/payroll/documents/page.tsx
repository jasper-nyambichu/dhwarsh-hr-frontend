import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { hasPermission } from "@/config/roles";
import { getPayrollRuns, getRunAgentSummaries } from "@/lib/api/payroll";
import { formatDateRange, formatMoney, formatNumber } from "@/lib/format";
import type { AgentPayrollSummaryResponse } from "@/types/agent-portal";
import type { PayrollRunResponse } from "@/types/payroll";

/**
 * Documents the backend actually generates for a run (proposal section 6.4):
 * the payroll register, and per agent an invoice, a payment voucher and a
 * payroll summary. Pick a run with `?run=` (defaults to the latest).
 */

function DocLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-outline-variant/40 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary-fixed"
    >
      <Icon name={icon} className="text-[14px]" />
      {label}
    </a>
  );
}

export default async function PayrollDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const session = await requirePermission("invoice:read");
  const { run: runParam } = await searchParams;
  const canReport = hasPermission(session.role, "report:read");

  let runs: PayrollRunResponse[];
  try {
    runs = await getPayrollRuns();
  } catch (error) {
    return (
      <DataUnavailable
        title="Payroll Documents"
        subject="The payroll run list"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  if (runs.length === 0) {
    return (
      <>
        <PageHeader title="Payroll Documents" />
        <EmptyState symbol="description" title="No documents yet" description="Documents are produced when payroll is run." />
      </>
    );
  }

  const requested = Number(runParam);
  const selected = runs.find((run) => run.id === requested) ?? runs[0];

  let summaries: AgentPayrollSummaryResponse[];
  try {
    summaries = await getRunAgentSummaries(selected.id);
  } catch (error) {
    return (
      <DataUnavailable
        title="Payroll Documents"
        subject="The agent documents for this run"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Payroll Documents"
        description="Download the register and each agent's invoice, voucher and summary."
        actions={
          <form method="get" className="flex items-center gap-2">
            <select
              name="run"
              defaultValue={selected.id}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {formatDateRange(run.periodStart, run.periodEnd)} · Run #{run.id}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container hover:bg-primary-fixed">
              View
            </button>
          </form>
        }
      />

      {canReport ? (
        <BentoCard title="Payroll Register" subtitle="Every employee's gross, deductions and net, with statutory totals to remit">
          <DocLink href={`/api/reports/payroll-register?runId=${selected.id}`} label="Open register PDF" icon="list_alt" />
        </BentoCard>
      ) : null}

      <BentoCard className="mt-gutter" title="Agent Documents" subtitle={formatDateRange(selected.periodStart, selected.periodEnd)}>
        {summaries.length === 0 ? (
          <EmptyState symbol="description" title="No agent documents" description="This run included no agent-supplied staff." />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Agent</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Staff</th>
                  <th className="pb-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Payable (KES)</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Documents</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {summaries.map((summary) => {
                  const base = `/api/payroll/documents/${selected.id}/${summary.agentId}`;
                  return (
                    <tr key={summary.id} className="border-b border-outline-variant/20 last:border-0">
                      <td className="py-3 pl-2 font-semibold">{summary.agentName ?? `Agent #${summary.agentId}`}</td>
                      <td className="py-3 text-right tabular-nums">{formatNumber(summary.employeeCount)}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatMoney(summary.finalAmountPayable, { showCurrency: false })}</td>
                      <td className="py-3 pr-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <DocLink href={`${base}/summary`} label="Summary" icon="description" />
                          <DocLink href={`${base}/voucher`} label="Voucher" icon="payments" />
                          <DocLink href={`${base}/invoice`} label="Invoice" icon="receipt_long" />
                        </div>
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