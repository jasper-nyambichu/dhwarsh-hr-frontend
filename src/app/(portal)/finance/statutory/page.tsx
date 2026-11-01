import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getFinanceRuns } from "@/lib/api/finance";
import { agentStatutory, directPaidInSalary, directStatutory, runPeriod } from "@/lib/finance-format";
import { humanizeEnum } from "@/lib/format";
import { formatKes } from "@/lib/money-format";

/**
 * What the company itself must remit for direct staff, run by run: PAYE and Housing Levy when the
 * Admin has switched them on, and the employer NITA. SHIF and NSSF are not remitted by the firm:
 * it pays no pension, so they go to the employee inside the salary. The system does not record
 * whether a remittance has been filed.
 */
export default async function FinanceStatutoryPage() {
  await requirePermission("payroll:read");

  let runs: Awaited<ReturnType<typeof getFinanceRuns>>;
  try {
    runs = await getFinanceRuns();
  } catch (error) {
    return (
      <DataUnavailable
        title="Statutory remittances"
        subject="The statutory figures"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const latest = runs[0];

  return (
    <>
      <PageHeader
        title="Statutory remittances"
        description="The PAYE, Housing Levy and NITA the company remits for its direct staff, per payroll run."
      />

      {!latest ? (
        <EmptyState symbol="account_balance" title="No payroll runs yet" description="Amounts to remit appear once Payroll runs a period." />
      ) : (
        <>
          <p className="mb-3 text-sm text-on-surface-variant">Latest run: {runPeriod(latest)}</p>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            <MetricCard label="PAYE" value={formatKes(latest.directPaye)} icon="account_balance_wallet" tone="primary" />
            <MetricCard label="Housing Levy" value={formatKes(latest.directHousingLevy)} icon="real_estate_agent" tone="primary" />
            <MetricCard label="NITA (employer)" value={formatKes(latest.directNita)} icon="school" tone="tertiary" />
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            SHIF and NSSF ({formatKes(directPaidInSalary(latest))} for direct staff in this run) are paid to the employees
            inside their salary and are not remitted by the company. Agents remit a further{" "}
            {formatKes(agentStatutory(latest))} of PAYE and Housing Levy inside their own payments.
          </p>

          <BentoCard className="mt-gutter" title="Every run" subtitle="Amounts the company remits, newest first">
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Period</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Run</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">PAYE</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Housing Levy</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">NITA</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Total to remit</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">SHIF + NSSF in salary</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {runs.map((run) => (
                    <tr key={run.runId} className="border-b border-outline-variant/20 last:border-0">
                      <td className="py-3 pl-2 font-semibold">{runPeriod(run)}</td>
                      <td className="py-3 text-on-surface-variant">{humanizeEnum(run.status)}</td>
                      <td className="py-3 text-right tabular-nums">{formatKes(run.directPaye)}</td>
                      <td className="py-3 text-right tabular-nums">{formatKes(run.directHousingLevy)}</td>
                      <td className="py-3 text-right tabular-nums">{formatKes(run.directNita)}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatKes(directStatutory(run))}</td>
                      <td className="py-3 pr-2 text-right tabular-nums text-on-surface-variant">{formatKes(directPaidInSalary(run))}</td>
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