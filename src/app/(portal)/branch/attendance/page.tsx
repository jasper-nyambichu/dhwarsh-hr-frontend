import Link from "next/link";
import { format } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { CHECKOUT_FILTERS, CheckoutTypes, clockTime, matchesCheckoutFilter } from "@/components/features/attendance/checkout-types";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { getAttendanceRecords } from "@/lib/api/attendance";
import { DateInput } from "@/components/shared/date-input";
import { formatDate, formatNumber } from "@/lib/format";
import { buildHref, first, parseDate, parsePage } from "@/lib/search-params";

const FIELD = "h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary";
const HEADER = "pb-3 font-table-header text-table-header uppercase text-outline";

/** One day of the manager's own branch (the backend scopes it): who came, who left, and why they stepped out. */
export default async function BranchAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("attendance:read:branch");

  const params = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const date = parseDate(first(params.date)) ?? today;
  const type = CHECKOUT_FILTERS.find((option) => option.value === first(params.type))?.value;
  const page = parsePage(first(params.page));

  let records: Awaited<ReturnType<typeof getAttendanceRecords>>;
  try {
    records = await getAttendanceRecords({ start: date, end: date, page, size: 100 });
  } catch (error) {
    return <DataUnavailable title="Attendance" subject="The attendance records" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const filters = { date, type };
  const shown = records.content.filter((record) => matchesCheckoutFilter(record, type));

  return (
    <>
      <PageHeader title="Attendance" description="How your employees are moving through the working day." />

      <form method="get" action="/branch/attendance" className="mb-4 flex flex-wrap items-end gap-3 rounded-card bg-surface-container-lowest p-3 shadow-ambient-1">
        <DateInput name="date" defaultValue={date} max={today} aria-label="Date" className={FIELD} />
        <select name="type" defaultValue={type ?? ""} aria-label="Check-out type" className={`${FIELD} min-w-0 max-w-full`}>
          <option value="">All check-out types</option>
          {CHECKOUT_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container">Apply</button>
        <Link href="/branch/attendance" className="flex h-10 items-center rounded-lg border border-outline-variant px-3 text-sm text-on-surface-variant hover:bg-surface-container-low">Clear</Link>
      </form>

      <BentoCard title={formatDate(date)} subtitle={`${formatNumber(shown.length)} employee${shown.length === 1 ? "" : "s"}`}>
        {shown.length === 0 ? (
          <EmptyState symbol="event_busy" title="Nobody to show" description="Try another date or check-out type." />
        ) : (
          <>
            <ul className="flex flex-col gap-3 md:hidden">
              {shown.map((record) => (
                <li key={record.id} className="min-w-0 rounded-lg border border-outline-variant/40 p-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-semibold text-on-surface">{record.employeeName ?? `Employee #${record.employeeId}`}</p>
                    <span className="shrink-0 font-mono text-xs text-on-surface-variant">{record.employeeNumber ?? ""}</span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <dt className="text-outline">Time Checked In</dt>
                      <dd className="tabular-nums text-on-surface">{clockTime(record.clockIn)}</dd>
                    </div>
                    <div>
                      <dt className="text-outline">Time Checked Out</dt>
                      <dd className="tabular-nums text-on-surface">{clockTime(record.clockOut)}</dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="mb-1 text-outline">Check-out Type</dt>
                      <dd><CheckoutTypes record={record} /></dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="hidden w-full overflow-x-auto md:block">
              <table className="data-table w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className={`${HEADER} pl-2`}>Emp No</th>
                    <th className={HEADER}>Employee Name</th>
                    <th className={HEADER}>Time Checked In</th>
                    <th className={HEADER}>Time Checked Out</th>
                    <th className={`${HEADER} pr-2`}>Check-out Type</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {shown.map((record) => (
                    <tr key={record.id} className="border-b border-outline-variant/20 align-top last:border-0">
                      <td className="py-3 pl-2 font-mono text-xs text-on-surface-variant">{record.employeeNumber ?? "—"}</td>
                      <td className="py-3 font-semibold">{record.employeeName ?? `Employee #${record.employeeId}`}</td>
                      <td className="py-3 tabular-nums">{clockTime(record.clockIn)}</td>
                      <td className="py-3 tabular-nums">{clockTime(record.clockOut)}</td>
                      <td className="py-3 pr-2"><CheckoutTypes record={record} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {records.totalPages > 1 ? <Pagination data={records} hrefFor={(target) => buildHref("/branch/attendance", filters, target)} /> : null}
      </BentoCard>
    </>
  );
}
