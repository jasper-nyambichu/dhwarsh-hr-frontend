import Link from "next/link";
import { format, parseISO, startOfMonth } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { getAttendanceRecords } from "@/lib/api/attendance";
import { getBranches } from "@/lib/api/branch";
import { formatDate, formatNumber, humanizeEnum } from "@/lib/format";
import { buildHref, first, parseDate, parseId, parsePage } from "@/lib/search-params";

const FIELD = "h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary";

function time(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "HH:mm");
  } catch {
    return value;
  }
}

/** Every attendance record over a period — the data payroll counts days worked from. */
export default async function BackOfficeAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("attendance:read");

  const params = await searchParams;
  const today = new Date();
  const branchId = parseId(first(params.branchId));
  const start = parseDate(first(params.start)) ?? format(startOfMonth(today), "yyyy-MM-dd");
  const end = parseDate(first(params.end)) ?? format(today, "yyyy-MM-dd");
  const openOnly = first(params.open) === "1";
  const page = parsePage(first(params.page));

  let records: Awaited<ReturnType<typeof getAttendanceRecords>>;
  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    [records, branches] = await Promise.all([
      getAttendanceRecords({ branchId, start, end, openOnly, page, size: 25 }),
      getBranches(),
    ]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Attendance"
        subject="The attendance records"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const filters = { branchId, start, end, open: openOnly ? "1" : undefined };

  return (
    <>
      <PageHeader title="Attendance" description="Who reported to work, and when. Agent payments count days worked from these records." />

      <form method="get" action="/backoffice/attendance" className="mb-4 flex flex-wrap items-end gap-3 rounded-card bg-surface-container-lowest p-3 shadow-ambient-1">
        <select name="branchId" defaultValue={branchId ?? ""} aria-label="Branch" className={FIELD}>
          <option value="">All branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
        <input type="date" name="start" defaultValue={start} aria-label="From date" className={FIELD} />
        <input type="date" name="end" defaultValue={end} aria-label="To date" className={FIELD} />
        <label className="flex h-10 items-center gap-2 text-sm text-on-surface-variant">
          <input type="checkbox" name="open" value="1" defaultChecked={openOnly} className="size-4 accent-primary" />
          Still on site
        </label>
        <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container">Apply</button>
        <Link href="/backoffice/attendance" className="flex h-10 items-center rounded-lg border border-outline-variant px-3 text-sm text-on-surface-variant hover:bg-surface-container-low">Reset</Link>
      </form>

      <BentoCard title="Records" subtitle={`${formatNumber(records.totalElements)} found`}>
        {records.content.length === 0 ? (
          <EmptyState symbol="event_busy" title="No attendance for these filters" description="Widen the dates, or check that the branch's device is registered and online." />
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Branch</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Date</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">In</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Out</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Hours</th>
                    <th className="pb-3 text-center font-table-header text-table-header uppercase text-outline">Status</th>
                    <th className="pb-3 pr-2 text-center font-table-header text-table-header uppercase text-outline">Source</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {records.content.map((record) => (
                    <tr key={record.id} className="border-b border-outline-variant/20 last:border-0">
                      <td className="py-3 pl-2">
                        <span className="block font-semibold">{record.employeeName ?? `Employee #${record.employeeId}`}</span>
                        <span className="block font-mono text-[11px] text-outline">{record.employeeNumber ?? ""}</span>
                      </td>
                      <td className="py-3 text-on-surface-variant">{record.branchName ?? "—"}</td>
                      <td className="py-3 text-on-surface-variant">{formatDate(record.attendanceDate)}</td>
                      <td className="py-3 text-right tabular-nums">{time(record.clockIn)}</td>
                      <td className="py-3 text-right tabular-nums">{time(record.clockOut)}</td>
                      <td className="py-3 text-right tabular-nums text-on-surface-variant">{record.hoursWorked === null ? "—" : record.hoursWorked.toFixed(1)}</td>
                      <td className="py-3 text-center text-xs font-medium">{humanizeEnum(record.status)}</td>
                      <td className="py-3 pr-2 text-center text-xs text-on-surface-variant">{humanizeEnum(record.source)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination data={records} hrefFor={(target) => buildHref("/backoffice/attendance", filters, target)} />
          </>
        )}
      </BentoCard>
    </>
  );
}