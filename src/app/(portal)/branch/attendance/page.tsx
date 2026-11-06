import Link from "next/link";
import { format } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AttendanceDayTable } from "@/components/features/attendance/attendance-day-table";
import { CHECKOUT_FILTERS, matchesCheckoutFilter } from "@/components/features/attendance/checkout-types";
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

/** One day of the manager's own branch (the backend scopes it): check-in, lunch, temporary check-out and check-out, as the Admin sees it. */
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
          <AttendanceDayTable
            rows={shown.map((record) => ({
              key: `record-${record.id}`,
              name: record.employeeName ?? `Employee #${record.employeeId}`,
              code: record.employeeNumber,
              record,
            }))}
          />
        )}
        {records.totalPages > 1 ? <Pagination data={records} hrefFor={(target) => buildHref("/branch/attendance", filters, target)} /> : null}
      </BentoCard>
    </>
  );
}
