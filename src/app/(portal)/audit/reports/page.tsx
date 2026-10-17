import { format, startOfMonth } from "date-fns";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getPayrollRuns } from "@/lib/api/payroll";
import { formatDateRange } from "@/lib/format";

const FIELD = "h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary";
const SUBMIT = "mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container";

/**
 * Reports the Auditor can generate. Each one is a plain GET form that opens the PDF / CSV in a
 * new tab through the portal's own download routes — nothing here changes any data.
 */
export default async function AuditReportsPage() {
  await requirePermission("report:read");

  let runs: Awaited<ReturnType<typeof getPayrollRuns>>;
  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    [runs, branches] = await Promise.all([getPayrollRuns(), getBranches()]);
  } catch (error) {
    return <DataUnavailable title="Reports" subject="The report options" reason={error instanceof Error ? error.message : undefined} />;
  }

  const today = new Date();

  return (
    <>
      <PageHeader title="Reports" description="Generate and download reports. Opening a report never changes anything." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        <BentoCard title="Payroll Register" subtitle="Every employee's gross, deductions and net, with statutory totals">
          <form method="get" action="/api/reports/payroll-register" target="_blank">
            <select name="runId" required defaultValue={runs[0]?.id ?? ""} className={FIELD} aria-label="Payroll run">
              {runs.length === 0 ? <option value="">No payroll runs yet</option> : null}
              {runs.map((run) => (
                <option key={run.id} value={run.id}>{formatDateRange(run.periodStart, run.periodEnd)} · Run #{run.id}</option>
              ))}
            </select>
            <button type="submit" disabled={runs.length === 0} className={SUBMIT}><Icon name="picture_as_pdf" className="text-[18px]" />Open PDF</button>
          </form>
        </BentoCard>

        <BentoCard title="Attendance Report" subtitle="One branch over a date range">
          <form method="get" action="/api/reports/attendance" target="_blank">
            <div className="flex flex-col gap-3">
              <select name="branchId" required defaultValue="" className={FIELD} aria-label="Branch">
                <option value="" disabled>Select a branch…</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" name="start" required defaultValue={format(startOfMonth(today), "yyyy-MM-dd")} className={FIELD} aria-label="From date" />
                <input type="date" name="end" required defaultValue={format(today, "yyyy-MM-dd")} className={FIELD} aria-label="To date" />
              </div>
            </div>
            <button type="submit" disabled={branches.length === 0} className={SUBMIT}><Icon name="picture_as_pdf" className="text-[18px]" />Open PDF</button>
          </form>
        </BentoCard>

        <BentoCard title="Employee List" subtitle="The staff register for the branches you choose">
          <form method="get" action="/api/reports/employee-list" target="_blank">
            <div className="flex max-h-44 flex-col gap-1 overflow-y-auto rounded-lg border border-outline-variant/40 p-2">
              {branches.map((branch) => (
                <label key={branch.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-container-low">
                  <input type="checkbox" name="branchIds" value={branch.id} defaultChecked className="size-4 accent-primary" />
                  {branch.name}
                </label>
              ))}
            </div>
            <button type="submit" disabled={branches.length === 0} className={SUBMIT}><Icon name="picture_as_pdf" className="text-[18px]" />Open PDF</button>
          </form>
        </BentoCard>

        <BentoCard title="Audit Log Export" subtitle="The history log as a spreadsheet (CSV), filtered by date">
          <form method="get" action="/api/audit/export">
            <div className="grid grid-cols-2 gap-3">
              <input type="date" name="from" defaultValue={format(startOfMonth(today), "yyyy-MM-dd")} className={FIELD} aria-label="From date" />
              <input type="date" name="to" defaultValue={format(today, "yyyy-MM-dd")} className={FIELD} aria-label="To date" />
            </div>
            <button type="submit" className={SUBMIT}><Icon name="download" className="text-[18px]" />Download CSV</button>
            <p className="mt-2 text-[11px] text-outline">Up to 5,000 events. Use the Audit Logs page to filter by user, action or record type first.</p>
          </form>
        </BentoCard>
      </div>
    </>
  );
}