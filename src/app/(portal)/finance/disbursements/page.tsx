import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getFinanceRuns } from "@/lib/api/finance";
import { directStatutory, runPeriod } from "@/lib/finance-format";
import { formatNumber, humanizeEnum } from "@/lib/format";
import { formatKes } from "@/lib/money-format";
import { RUN_STATUS_CHIP } from "@/lib/payroll-format";

/** Money out: what each payroll run costs in cash, split into direct staff, agents and statutory. */
export default async function FinanceDisbursementsPage() {
  await requirePermission("payroll:read");

  let runs: Awaited<ReturnType<typeof getFinanceRuns>>;
  try {
    runs = await getFinanceRuns();
  } catch (error) {
    return (
      <DataUnavailable
        title="Disbursements"
        subject="The payroll cash figures"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const latest = runs[0];

  return (
    <>
      <PageHeader
        title="Disbursements"
        description="What each payroll run costs in cash: direct staff pay, agent payments and the statutory amounts the company remits."
      />

      {!latest ? (
        <EmptyState symbol="payments" title="No payroll runs yet" description="Cash requirements appear once Payroll runs a period." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            <MetricCard label="Latest run: cash needed" value={formatKes(latest.totalCashRequirement)} icon="payments" tone="primary" hint={runPeriod(latest)} />
            <MetricCard label="Direct staff net pay" value={formatKes(latest.directNetPay)} icon="groups" tone="primary" hint={`${formatNumber(latest.directEmployees)} employees`} />
            <MetricCard label="Agent payments" value={formatKes(latest.agentPayable)} icon="handshake" tone="tertiary" hint={`${formatNumber(latest.agentCount)} agents`} />
          </div>

          <BentoCard className="mt-gutter" title="All payroll runs" subtitle="Newest period first">
            {/* Phones: one card per run */}
            <ul className="flex flex-col gap-3 md:hidden">
              {runs.map((run) => (
                <li key={run.runId}>
                  <Link
                    href={`/finance/disbursements/${run.runId}`}
                    className="block rounded-lg border border-outline-variant/50 p-3 hover:bg-surface-container-low"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">{runPeriod(run)}</p>
                        <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${RUN_STATUS_CHIP[run.status] ?? ""}`}>
                          {humanizeEnum(run.status)}
                        </span>
                      </div>
                      <p className="text-lg font-bold tabular-nums text-on-surface">{formatKes(run.totalCashRequirement)}</p>
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Staff {formatKes(run.directNetPay)} · Agents {formatKes(run.agentPayable)} · Statutory {formatKes(directStatutory(run))}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Tablets and desktops: a table */}
            <div className="hidden w-full overflow-x-auto md:block">
              <table className="data-table w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Period</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Status</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Direct staff net</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Agent payments</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Statutory to remit</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Total cash</th>
                    <th className="pb-3 pr-2" />
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {runs.map((run) => (
                    <tr key={run.runId} className="border-b border-outline-variant/20 last:border-0">
                      <td className="py-3 pl-2 font-semibold">{runPeriod(run)}</td>
                      <td className="py-3">
                        <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${RUN_STATUS_CHIP[run.status] ?? ""}`}>
                          {humanizeEnum(run.status)}
                        </span>
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatKes(run.directNetPay)}</td>
                      <td className="py-3 text-right tabular-nums">{formatKes(run.agentPayable)}</td>
                      <td className="py-3 text-right tabular-nums">{formatKes(directStatutory(run))}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatKes(run.totalCashRequirement)}</td>
                      <td className="py-3 pr-2 text-right">
                        <Link href={`/finance/disbursements/${run.runId}`} className="text-sm font-semibold text-primary hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </>
      )}
    </>
  );
}