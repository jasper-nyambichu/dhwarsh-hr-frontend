import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getFinanceRun } from "@/lib/api/finance";
import { getRunAgentSummaries } from "@/lib/api/payroll";
import { agentStatutory, directStatutory, runPeriod } from "@/lib/finance-format";
import { formatNumber, humanizeEnum } from "@/lib/format";
import { formatKes } from "@/lib/money-format";
import { RUN_STATUS_CHIP } from "@/lib/payroll-format";

function Row({ label, amount, strong = false }: { label: string; amount: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline-variant/20 py-2 text-sm last:border-0">
      <span className={strong ? "font-semibold text-on-surface" : "text-on-surface-variant"}>{label}</span>
      <span className={`tabular-nums ${strong ? "font-bold text-on-surface" : "text-on-surface"}`}>{formatKes(amount)}</span>
    </div>
  );
}

/** One payroll run's cash requirement, line by line, with each agent's payment voucher. */
export default async function FinanceRunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  await requirePermission("payroll:read");

  const { runId: rawRunId } = await params;
  const runId = Number(rawRunId);
  if (!Number.isInteger(runId) || runId <= 0) notFound();

  let run: Awaited<ReturnType<typeof getFinanceRun>>;
  let agents: Awaited<ReturnType<typeof getRunAgentSummaries>>;
  try {
    [run, agents] = await Promise.all([getFinanceRun(runId), getRunAgentSummaries(runId)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return (
      <DataUnavailable
        title="Payroll run"
        subject="This run's cash figures"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={
          <>
            <Link href="/finance/disbursements" className="mr-2 text-sm font-medium text-primary hover:underline">
              ← Disbursements
            </Link>
            {runPeriod(run)}
          </>
        }
        pill={
          <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${RUN_STATUS_CHIP[run.status] ?? ""}`}>
            {humanizeEnum(run.status)}
          </span>
        }
        description="Direct staff are paid their net salary and the company remits their statutory amounts. Agent-supplied staff are paid through one amount to the agent."
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Total cash needed" value={formatKes(run.totalCashRequirement)} icon="payments" tone="primary" />
        <MetricCard label="Direct staff net pay" value={formatKes(run.directNetPay)} icon="groups" tone="primary" hint={`${formatNumber(run.directEmployees)} employees`} />
        <MetricCard label="Agent payments" value={formatKes(run.agentPayable)} icon="handshake" tone="tertiary" hint={`${formatNumber(run.agentCount)} agents`} />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <BentoCard title="Direct employees" subtitle="Paid by the company">
          <Row label="Net pay to employees" amount={run.directNetPay} />
          <Row label="PAYE to remit" amount={run.directPaye} />
          <Row label="NSSF to remit" amount={run.directNssf} />
          <Row label="SHIF to remit" amount={run.directShif} />
          <Row label="Housing Levy to remit" amount={run.directHousingLevy} />
          <Row label="NITA (employer levy)" amount={run.directNita} />
          <Row label="Statutory total" amount={directStatutory(run)} strong />
          <p className="mt-3 text-xs text-on-surface-variant">
            Loan instalments withheld from this staff&apos;s pay: {formatKes(run.directLoanRecoveries)}. They reduce
            what is paid out and are not a separate payment.
          </p>
        </BentoCard>

        <BentoCard title="Agent payments" subtitle="One payment to each agent">
          <Row label="Total payable to agents" amount={run.agentPayable} strong />
          <Row label="of which VAT" amount={run.agentVat} />
          <Row label="PAYE inside the payments" amount={run.agentPaye} />
          <Row label="NSSF inside the payments" amount={run.agentNssf} />
          <Row label="SHIF inside the payments" amount={run.agentShif} />
          <Row label="Housing Levy inside the payments" amount={run.agentHousingLevy} />
          <p className="mt-3 text-xs text-on-surface-variant">
            The agents remit {formatKes(agentStatutory(run))} of statutory amounts themselves, so the company does not
            remit them a second time.
          </p>
        </BentoCard>
      </div>

      <BentoCard className="mt-gutter" title="Each agent" subtitle="Final amount payable and payment documents">
        {agents.length === 0 ? (
          <EmptyState symbol="handshake" title="No agent payments in this run" />
        ) : (
          <ul className="flex flex-col gap-3">
            {agents.map((summary) => (
              <li
                key={summary.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant/50 p-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">{summary.agentName ?? `Agent #${summary.agentId}`}</p>
                  <p className="text-xs text-on-surface-variant">{formatNumber(summary.employeeCount)} employees</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-bold tabular-nums text-on-surface">{formatKes(summary.finalAmountPayable)}</p>
                  <Link href={`/finance/invoices/${summary.id}`} className="text-sm font-semibold text-primary hover:underline">
                    Statement
                  </Link>
                  <a
                    href={`/api/payroll/documents/${run.runId}/${summary.agentId}/voucher`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Payment voucher (PDF)
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </BentoCard>
    </>
  );
}