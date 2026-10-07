import Link from "next/link";
import { notFound } from "next/navigation";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfWeek,
} from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { SegmentStrip, type Segment } from "@/components/shared/segment-strip";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getAttendanceForEmployee } from "@/lib/api/attendance";
import { getEmployee } from "@/lib/api/employee";
import {
  formatDate,
  formatHours,
  formatNumber,
  formatTime,
  humanizeEnum,
  initials,
} from "@/lib/format";
import { first } from "@/lib/search-params";
import type { AttendanceResponse, EmployeeResponse } from "@/types";

/**
 * One employee's attendance history.
 *
 * `GET /attendance/employee/{id}` requires `start` **and** `end` as mandatory
 * query params — omitting either is a 400, not a defaulted range — so the month
 * being viewed is what supplies them. That is also why the month is a real
 * `?month=` search param rather than local state: the range is part of the
 * request, so it belongs in the URL.
 *
 * There is no "hours worked" field on `AttendanceResponse`, so the Hours column
 * is derived from clock-in against clock-out and shows nothing when either is
 * missing. The dashboard's own projection has a real `hoursWorked`; this
 * endpoint does not.
 */

/** Monday-first, matching the Kenyan working week. */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * How a single day reads in the grid. `off` is an in-month day with no record;
 * `outside` is padding from the adjacent month.
 */
type DayTone = "present" | "late" | "absent" | "leave" | "off" | "outside";

const TONE: Record<DayTone, { cell: string; swatch: string; label: string }> = {
  present: {
    cell: "border-tertiary-container/50 bg-tertiary-container/30 text-on-tertiary-fixed-variant",
    swatch: "border-tertiary-container bg-tertiary-container/40",
    label: "Present",
  },
  late: {
    cell: "border-amber-main/30 bg-amber-main/10 text-amber-main",
    swatch: "border-amber-main bg-amber-main/20",
    label: "Late",
  },
  absent: {
    cell: "border-error-container bg-error-container text-on-error-container",
    swatch: "border-error-container bg-error-container",
    label: "Absent",
  },
  leave: {
    cell: "border-primary-container/40 bg-primary-container/20 text-on-primary-fixed-variant",
    swatch: "border-primary-container bg-primary-container/20",
    label: "Leave",
  },
  off: {
    cell: "border-outline-variant bg-surface-container-lowest text-outline",
    swatch: "border-outline-variant bg-surface-container-lowest",
    label: "No record",
  },
  outside: {
    cell: "border-transparent bg-surface-container text-on-surface-variant opacity-50",
    swatch: "border-transparent bg-surface-container",
    label: "Other month",
  },
};

/** Legend order. Drawn from `TONE` so swatches can never drift from cells. */
const LEGEND: readonly DayTone[] = ["present", "late", "absent", "leave"];

/**
 * Status → tone. `HALF_DAY` and `HOLIDAY` are in the union but have no tone of
 * their own; they fall through to `off` rather than being coloured as something
 * they are not. An unrecognised status does the same — the column is a free
 * `String` and can carry `OVERTIME`, which is not in the union at all.
 */
function toneFor(status: string): DayTone {
  switch (status) {
    case "PRESENT":
      return "present";
    case "LATE":
      return "late";
    case "ABSENT":
      return "absent";
    case "ON_LEAVE":
      return "leave";
    default:
      return "off";
  }
}

/** `yyyy-MM` only. Anything else falls back to the current month. */
function parseMonth(value: string | undefined): Date {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const parsed = parseISO(`${value}-01`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

/**
 * The month stepper's target. Built by hand rather than through `buildHref`,
 * because the employee id is a path segment here — `buildHref` only ever emits
 * a query string.
 */
function monthHref(employeeId: number, date: Date): string {
  return `/hr/attendance/${employeeId}?month=${monthKey(date)}`;
}

function minutesBetween(clockIn: string | null, clockOut: string | null): number | null {
  if (!clockIn || !clockOut) return null;

  const start = new Date(clockIn).getTime();
  const end = new Date(clockOut).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;

  return Math.round((end - start) / 60_000);
}

/** Decimal hours, or `null` when the day is not a complete pair of scans. */
function hoursOf(record: AttendanceResponse): number | null {
  const minutes = minutesBetween(record.clockIn, record.clockOut);
  return minutes === null ? null : minutes / 60;
}

export default async function EmployeeAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  await requirePermission("attendance:read");

  const { employeeId: rawEmployeeId } = await params;
  const employeeId = Number(rawEmployeeId);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    notFound();
  }

  const search = await searchParams;
  const month = parseMonth(first(search.month));

  // Inclusive bounds, `yyyy-MM-dd` — the endpoint rejects anything else, and
  // rejects a missing bound outright.
  const start = format(startOfWeek(month, WEEK_OPTIONS), "yyyy-MM-dd");
  const end = format(endOfWeek(endOfMonth(month), WEEK_OPTIONS), "yyyy-MM-dd");

  let employee: EmployeeResponse;
  let records: AttendanceResponse[];

  try {
    [employee, records] = await Promise.all([
      getEmployee(employeeId),
      getAttendanceForEmployee(employeeId, { start, end }),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    if (error instanceof ApiError && error.isNotFound) {
      notFound();
    }

    return (
      <DataUnavailable
        title="Employee Attendance"
        description="One employee's clock history."
        subject={`The attendance history for employee #${employeeId}`}
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  // One record per day per employee, newest first in the log.
  const byDate = new Map(
    records.map((record) => [record.attendanceDate, record]),
  );
  const log = [...records].sort((a, b) =>
    a.attendanceDate < b.attendanceDate ? 1 : -1,
  );

  const gridDays = eachDayOfInterval({
    start: startOfWeek(month, WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  });

  const inMonth = records.filter((record) =>
    isSameMonth(parseISO(record.attendanceDate), month),
  );

  const counts = countByTone(inMonth);
  const summary: Segment[] = (["present", "late", "absent"] as const).map(
    (tone) => ({
      label: TONE[tone].label,
      value: formatNumber(counts[tone]),
      tone: tone === "present" ? "success" : tone === "late" ? "warning" : "error",
    }),
  );

  const totalMinutes = inMonth.reduce(
    (sum, record) => sum + (minutesBetween(record.clockIn, record.clockOut) ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/hr/attendance"
              aria-label="Back to attendance board"
              className="text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <Icon name="arrow_back" />
            </Link>
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-[13px] font-bold text-on-primary"
            >
              {initials(employee.fullName)}
            </span>
            {employee.fullName} — Attendance
          </span>
        }
        description={`${employee.employeeNumber} · ${
          employee.position ?? "No position"
        } · ${employee.branchName ?? "No branch"}`}
        actions={
          <Link
            href={`/hr/employees/${employeeId}`}
            className={buttonVariants({ variant: "secondary" })}
          >
            <Icon name="person" className="text-[18px]" />
            View profile
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title={format(month, "MMMM yyyy")}
            action={
              <div className="flex gap-2">
                <Link
                  href={monthHref(employeeId, addMonths(month, -1))}
                  aria-label={`Previous month — ${format(addMonths(month, -1), "MMMM yyyy")}`}
                  className="rounded bg-surface-container p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
                >
                  <Icon name="chevron_left" className="text-[18px]" />
                </Link>
                <Link
                  href={monthHref(employeeId, addMonths(month, 1))}
                  aria-label={`Next month — ${format(addMonths(month, 1), "MMMM yyyy")}`}
                  className="rounded bg-surface-container p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
                >
                  <Icon name="chevron_right" className="text-[18px]" />
                </Link>
              </div>
            }
          >
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center font-table-header text-[10px] uppercase text-outline"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {gridDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const outside = !isSameMonth(day, month);
                const record = byDate.get(key);
                const tone: DayTone = outside
                  ? "outside"
                  : record
                    ? toneFor(record.status)
                    : "off";

                return (
                  <div
                    key={key}
                    title={
                      outside
                        ? undefined
                        : record
                          ? `${key} · ${humanizeEnum(record.status)} · ${
                              record.clockIn ? formatTime(record.clockIn) : "no clock-in"
                            }`
                          : `${key} · no record`
                    }
                    className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-[11px] font-medium ${TONE[tone].cell}`}
                  >
                    <span className="tabular-nums">{format(day, "d")}</span>
                    {record && !outside ? (
                      <span className="mt-0.5 text-[9px] tabular-nums opacity-80">
                        {record.clockIn ? formatTime(record.clockIn) : "—"}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-4 border-t border-outline-variant/40 pt-4">
              {LEGEND.map((tone) => (
                <span key={tone} className="flex items-center gap-2">
                  <span className={`size-3 rounded-sm border ${TONE[tone].swatch}`} />
                  <span className="font-body-md text-[11px] text-on-surface-variant">
                    {TONE[tone].label}
                  </span>
                </span>
              ))}
              <span className="flex items-center gap-2">
                <span className={`size-3 rounded-sm border ${TONE.off.swatch}`} />
                <span className="font-body-md text-[11px] text-on-surface-variant">
                  No record
                </span>
              </span>
            </div>

            <p className="mt-4 text-[11px] text-outline">
              The grid covers the whole weeks the month falls in, so a few days
              either side of {format(month, "MMMM")} are fetched too. A day
              carried by neither a shift nor a scan simply has no record —
              nothing here infers absence.
            </p>
          </BentoCard>

          <BentoCard
            title="Daily Log"
            subtitle={`${formatNumber(log.length)} ${
              log.length === 1 ? "record" : "records"
            } in range`}
          >
            {log.length === 0 ? (
              <div className="rounded-card border border-dashed border-outline-variant px-4 py-12 text-center">
                <Icon name="event_busy" className="text-[40px] text-outline-variant" />
                <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                  No attendance recorded in this range.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Date
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Clock In
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Clock Out
                      </th>
                      <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">
                        Hours
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Source
                      </th>
                      <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md text-on-surface">
                    {log.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-outline-variant/20 last:border-0"
                      >
                        <td className="py-3 text-on-surface-variant">
                          {formatDate(record.attendanceDate)}
                        </td>
                        <td className="py-3 tabular-nums text-on-surface-variant">
                          {formatTime(record.clockIn)}
                        </td>
                        <td className="py-3 tabular-nums text-on-surface-variant">
                          {formatTime(record.clockOut)}
                        </td>
                        <td className="py-3 text-right tabular-nums text-on-surface-variant">
                          {formatHours(hoursOf(record))}
                        </td>
                        <td className="py-3 text-on-surface-variant">
                          {humanizeEnum(record.source)}
                        </td>
                        <td className="py-3 text-right">
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>

        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <SegmentStrip segments={summary} />

          <BentoCard title="This Month">
            <dl className="flex flex-col gap-3">
              <Stat
                label="Days recorded"
                value={formatNumber(inMonth.length)}
              />
              <Stat
                label="Hours clocked"
                value={formatHours(totalMinutes / 60)}
              />
              <Stat
                label="Days with no record"
                value={formatNumber(
                  eachDayOfInterval({
                    start: month,
                    end: endOfMonth(month),
                  }).filter(
                    (day) =>
                      day.getDay() !== 0 &&
                      day.getDay() !== 6 &&
                      !byDate.has(format(day, "yyyy-MM-dd")),
                  ).length,
                )}
                hint="Weekdays only"
              />
            </dl>

            <p className="mt-5 border-t border-outline-variant/40 pt-4 text-[11px] text-outline">
              &ldquo;Days with no record&rdquo; counts weekdays the endpoint
              returned nothing for. It is a gap in the data, not a finding —
              nothing in this API says whether the employee was expected to work
              that day.
            </p>
          </BentoCard>
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-body-md text-body-md text-on-surface-variant">
        {label}
        {hint ? (
          <span className="ml-1 text-[10px] text-outline">({hint})</span>
        ) : null}
      </dt>
      <dd className="font-body-md text-body-md font-semibold tabular-nums text-on-surface">
        {value}
      </dd>
    </div>
  );
}

function countByTone(records: AttendanceResponse[]): Record<DayTone, number> {
  const counts: Record<DayTone, number> = {
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    off: 0,
    outside: 0,
  };

  for (const record of records) {
    counts[toneFor(record.status)] += 1;
  }

  return counts;
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
