import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getLoans, getPaymentRequests } from "@/lib/api/agent-money";
import { getFinanceRuns } from "@/lib/api/finance";
import { directStatutory, runPeriod } from "@/lib/finance-format";
import { humanizeEnum } from "@/lib/format";
import { formatKes } from "@/lib/money-format";
import { RUN_STATUS_CHIP } from "@/lib/payroll-format";

/** Accounts Office dashboard: this run's cash need, what is waiting to be released, and what is owed back. */
export default async function FinanceDashboardPage() {
  await requirePermission("payroll:read");

  let runs: Awaited<ReturnType<typeof getFinanceRuns>>;
  let toRelease: Awaited<ReturnType<typeof getPaymentRequests>>;
  let loans: Awaited<ReturnType<typeof getLoans>>;
  try {
    [runs, toRelease, loans] = await Promise.all([getFinanceRuns(), getPaymentRequests("APPROVED"), getLoans()]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Accounts Office"
        subject="The finance dashboard"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const latest = runs[0];
  const awaiting = toRelease.reduce((sum, request) => sum + request.amount, 0);
  const loansOutstanding = loans
    .filter((loan) => loan.status === "APPROVED")
    .reduce((sum, loan) => sum + (loan.outstandingBalance ?? 0), 0);

  return (
    <>
      <PageHeader title="Accounts Office" description="Cash needed for payroll, money waiting to be released, and what is still owed back." />

      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Latest run: cash needed"
          value={latest ? formatKes(latest.totalCashRequirement) : "—"}
          icon="payments"
          tone="primary"
          hint={latest ? runPeriod(latest) : "No runs yet"}
        />
        <MetricCard
          label="Statutory to remit"
          value={latest ? formatKes(directStatutory(latest)) : "—"}
          icon="gavel"
          tone="tertiary"
          hint="Latest run, direct staff"
        />
        <MetricCard
          label="Waiting to be released"
          value={formatKes(awaiting)}
          icon="outbox"
          tone={toRelease.length > 0 ? "amber" : "primary"}
          hint={`${toRelease.length} approved requests`}
        />
        <MetricCard label="Loans outstanding" value={formatKes(loansOutstanding)} icon="savings" tone="primary" />
      </div>

      <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <BentoCard title="Where the cash goes" subtitle={latest ? runPeriod(latest) : undefined}>
          {latest ? (
            <DonutChart
              centerLabel="Total"
              segments={[
                { label: "Direct staff net pay", value: latest.directNetPay, color: "var(--color-primary)" },
                { label: "Agent payments", value: latest.agentPayable, color: "var(--color-secondary)" },
                { label: "Statutory (company)", value: directStatutory(latest), color: "var(--color-error)" },
              ]}
            />
          ) : (
            <EmptyState symbol="donut_large" title="No payroll runs yet" />
          )}
        </BentoCard>

        <BentoCard className="lg:col-span-2" title="Recent runs" subtitle="Open one to see it line by line">
          {runs.length === 0 ? (
            <EmptyState symbol="payments" title="No payroll runs yet" />
          ) : (
            <ul className="flex flex-col gap-3">
              {runs.slice(0, 5).map((run) => (
                <li key={run.runId}>
                  <Link
                    href={`/finance/disbursements/${run.runId}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant/50 p-3 hover:bg-surface-container-low"
                  >
                    <div>
                      <p className="font-semibold text-on-surface">{runPeriod(run)}</p>
                      <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${RUN_STATUS_CHIP[run.status] ?? ""}`}>
                        {humanizeEnum(run.status)}
                      </span>
                    </div>
                    <p className="text-lg font-bold tabular-nums text-on-surface">{formatKes(run.totalCashRequirement)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </BentoCard>
      </div>

      {toRelease.length > 0 ? (
        <p className="mt-gutter text-sm text-on-surface-variant">
          {toRelease.length} approved payment request{toRelease.length === 1 ? " is" : "s are"} waiting.{" "}
          <Link href="/finance/releases" className="font-semibold text-primary hover:underline">
            Go to Releases
          </Link>
        </p>
      ) : null}
    </>
  );
}