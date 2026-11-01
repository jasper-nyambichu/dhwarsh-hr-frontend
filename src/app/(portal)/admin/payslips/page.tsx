import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getPayrollRuns, getRunPayslips } from "@/lib/api/payroll";
import { formatDateRange, formatMoney, initials } from "@/lib/format";
import type { PayrollRunResponse, PayslipResponse } from "@/types/payroll";

/**
 * Payslips for one payroll run. The run is chosen with `?run=` (defaults to the
 * latest). A payslip belongs to a run, so there is no company-wide payslip list.
 */
export default async function PayrollPayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  await requirePermission("payslip:read");
  const { run: runParam } = await searchParams;

  let runs: PayrollRunResponse[];
  try {
    runs = await getPayrollRuns();
  } catch (error) {
    return (
      <DataUnavailable
        title="Payslips"
        subject="The payroll run list"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  if (runs.length === 0) {
    return (
      <>
        <PageHeader title="Payslips" />
        <EmptyState symbol="receipt_long" title="No payslips yet" description="Payslips appear here once payroll has been run." />
      </>
    );
  }

  const requested = Number(runParam);
  const selected = runs.find((run) => run.id === requested) ?? runs[0];

  let payslips: PayslipResponse[];
  try {
    payslips = await getRunPayslips(selected.id);
  } catch (error) {
    return (
      <DataUnavailable
        title="Payslips"
        subject="The payslips for this run"
        reason={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Payslips"
        description={`${payslips.length} payslip${payslips.length === 1 ? "" : "s"} in this run`}
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

      <BentoCard flush>
        <div className="overflow-x-auto p-card-padding">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-variant">
                <th className="px-4 py-3 font-table-header uppercase text-on-surface-variant">Employee</th>
                <th className="px-4 py-3 text-right font-table-header uppercase text-on-surface-variant">Gross</th>
                <th className="px-4 py-3 text-right font-table-header uppercase text-on-surface-variant">Deductions</th>
                <th className="px-4 py-3 text-right font-table-header uppercase text-on-surface-variant">Net</th>
                <th className="px-4 py-3 text-center font-table-header uppercase text-on-surface-variant">View</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((payslip) => (
                <tr key={payslip.id} className="border-b border-surface-variant transition-colors last:border-0 hover:bg-surface">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initials(payslip.employeeName)}
                      </span>
                      <span>
                        <span className="block font-body-md font-medium text-on-surface">{payslip.employeeName ?? "—"}</span>
                        <span className="block text-xs text-outline">{payslip.employeeNumber ?? ""}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-body-md text-on-surface">{formatMoney(payslip.grossPay)}</td>
                  <td className="px-4 py-4 text-right font-body-md text-error">-{formatMoney(payslip.grossPay - payslip.netPay)}</td>
                  <td className="px-4 py-4 text-right font-body-md font-bold text-primary">{formatMoney(payslip.netPay)}</td>
                  <td className="px-4 py-4 text-center">
                    <Link href={`/admin/payslips/${payslip.id}`} aria-label={`Open payslip for ${payslip.employeeName ?? "employee"}`} className="inline-flex text-primary hover:text-on-primary-fixed-variant">
                      <Icon name="visibility" className="text-[20px]" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>
    </>
  );
}