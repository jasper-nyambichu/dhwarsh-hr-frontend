import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { PunctualityCards } from "@/components/features/attendance/punctuality-cards";
import { MonthNav } from "@/components/features/off-days/off-day-calendar";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { FilterSelect } from "@/components/shared/filter-select";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getPunctuality } from "@/lib/api/attendance";
import { getBranches } from "@/lib/api/branch";
import { formatNumber, formatTime } from "@/lib/format";
import { monthLabel, monthRange, parseMonth } from "@/lib/off-days";
import { buildHref, first, parseId } from "@/lib/search-params";

/**
 * Attendance → Records: how each employee has been reporting to work in a month and whether they keep to work
 * time (arrival by the work start, staying to the work end, back from lunch within its 30 minutes). A card each.
 */
export default async function AttendanceRecordsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("attendance:read");

  const query = await searchParams;
  const month = parseMonth(first(query.month));
  const branchId = parseId(first(query.branch));
  const range = monthRange(month);

  let data: { report: Awaited<ReturnType<typeof getPunctuality>>; branches: Awaited<ReturnType<typeof getBranches>> };
  try {
    const [report, branches] = await Promise.all([getPunctuality({ start: range.from, end: range.to, branchId }), getBranches()]);
    data = { report, branches };
  } catch (error) {
    return <DataUnavailable title="Attendance Records" subject="The attendance records" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const rows = data.report.employees;
  const withDays = rows.filter((row) => row.daysReported > 0);
  const average = (pick: (row: (typeof rows)[number]) => number | null) => {
    const values = withDays.map(pick).filter((value): value is number => value !== null);
    return values.length === 0 ? null : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };
  const path = "/admin/attendance/records";

  return (
    <>
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/attendance"
              aria-label="Back to attendance"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            <span className="min-w-0 break-words">Attendance Records</span>
          </span>
        }
        description={`How each employee reports to work and keeps to work time (${formatTime(data.report.workStart)} to ${formatTime(data.report.workEnd)}, set in Settings).`}
        actions={<MonthNav month={month} hrefFor={(target) => buildHref(path, { month: target, branch: branchId })} />}
      />

      <div className="flex flex-col gap-gutter">
        <div className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
          <MetricCard label="Employees" value={formatNumber(rows.length)} icon="group" hint={monthLabel(month)} />
          <MetricCard label="Reported" value={average((row) => row.attendancePercent) === null ? "—" : `${average((row) => row.attendancePercent)}%`} icon="event_available" hint="Average of expected days" />
          <MetricCard label="On time" value={average((row) => row.punctualityPercent) === null ? "—" : `${average((row) => row.punctualityPercent)}%`} icon="schedule" tone="tertiary" hint="Average of arrivals" />
          <MetricCard
            label="Late from lunch"
            value={formatNumber(rows.reduce((sum, row) => sum + row.lateLunchReturns, 0))}
            icon="restaurant"
            hint="Returns after the 30 minutes"
          />
        </div>

        <form method="get" action={path} className="bento-card grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
          <input type="hidden" name="month" value={month} />
          <FilterSelect
            name="branch"
            label="Branch"
            defaultValue={branchId ? String(branchId) : ""}
            options={[
              { value: "", label: "All branches" },
              ...data.branches
                .filter((branch) => branch.status === "ACTIVE")
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((branch) => ({ value: String(branch.id), label: branch.name })),
            ]}
          />
          <div className="flex gap-2 sm:col-span-2 sm:items-end">
            <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container">
              Apply
            </button>
            {branchId !== undefined ? (
              <Link href={buildHref(path, { month })} className="flex h-10 items-center rounded-lg border border-outline-variant px-3 text-sm text-on-surface-variant hover:bg-surface-container-low">
                Reset
              </Link>
            ) : null}
          </div>
        </form>

        <PunctualityCards rows={rows} employeeHref={(id) => `/admin/employees/${id}?month=${month}#attendance-record`} showBranch={branchId === undefined} />
      </div>
    </>
  );
}
