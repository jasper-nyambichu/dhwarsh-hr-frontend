import Link from "next/link";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
} from "date-fns";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
  formatTime,
  initials,
} from "@/lib/format";
import type { AttendanceStatus } from "@/types";

/**
 * One employee's attendance history — a month heat grid over a daily log.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/attendance/{employeeId}` endpoint yet. Replace
 * with `await api.get<Attendance[]>(`/attendance/${employeeId}`, { month })`;
 * `DAY_STATUS` is keyed by `attendanceDate` so the swap is a single reduce.
 * ─────────────────────────────────────────────────────────────────────────
 */

const EMPLOYEE = {
  fullName: "Amina Yusuf",
  employeeNumber: "NCBD-0211",
  position: "Senior Financial Analyst",
  branchName: "Nairobi CBD",
} as const;

/** First day of the month on display. Becomes a `?month=` param once wired. */
const MONTH_ANCHOR = new Date(2026, 7, 1);

/** Monday-first, matching the Kenyan working week. */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * How a single day reads in the grid. `off` is an in-month day with no record
 * (weekend or not yet worked); `outside` is padding from the adjacent month.
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

/** Keyed by `yyyy-MM-dd`. Days absent from the map render as `off`. */
const DAY_STATUS: Record<string, DayTone> = {
  "2026-08-03": "present",
  "2026-08-04": "present",
  "2026-08-05": "late",
  "2026-08-06": "present",
  "2026-08-07": "present",
  "2026-08-10": "present",
  "2026-08-11": "present",
  "2026-08-12": "absent",
  "2026-08-13": "present",
  "2026-08-14": "present",
  "2026-08-17": "leave",
  "2026-08-18": "leave",
  "2026-08-19": "present",
  "2026-08-20": "present",
  "2026-08-21": "late",
  "2026-08-24": "present",
  "2026-08-25": "present",
  "2026-08-26": "present",
  "2026-08-27": "present",
  "2026-08-28": "present",
  "2026-08-31": "present",
};

/** Six full weeks covering the month, padded to whole Mon–Sun rows. */
const GRID_DAYS = eachDayOfInterval({
  start: startOfWeek(MONTH_ANCHOR, WEEK_OPTIONS),
  end: endOfWeek(endOfMonth(MONTH_ANCHOR), WEEK_OPTIONS),
});

type LogRow = {
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  minutesWorked: number | null;
  status: AttendanceStatus;
};

const DAILY_LOG: readonly LogRow[] = [
  {
    date: "2026-08-07",
    clockIn: "08:00:00",
    clockOut: "17:00:00",
    minutesWorked: 480,
    status: "PRESENT",
  },
  {
    date: "2026-08-06",
    clockIn: "07:55:00",
    clockOut: "17:05:00",
    minutesWorked: 490,
    status: "PRESENT",
  },
  {
    date: "2026-08-05",
    clockIn: "08:15:00",
    clockOut: "17:00:00",
    minutesWorked: 465,
    status: "LATE",
  },
  {
    date: "2026-08-04",
    clockIn: "07:58:00",
    clockOut: "17:02:00",
    minutesWorked: 484,
    status: "PRESENT",
  },
  {
    date: "2026-08-03",
    clockIn: "08:02:00",
    clockOut: "17:00:00",
    minutesWorked: 478,
    status: "PRESENT",
  },
];

/** Hours worked against the contracted monthly target, in minutes. */
const HOURS = { worked: 6870, target: 9600 } as const;

const SUMMARY: readonly { tone: DayTone; count: number }[] = [
  { tone: "present", count: 16 },
  { tone: "late", count: 2 },
  { tone: "absent", count: 1 },
];

export default async function EmployeeAttendancePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  await requirePermission("attendance:read");
  const { employeeId } = await params;
  const employee = EMPLOYEE; // TODO: fetch by `employeeId` once the endpoint exists

  const hoursPct = Math.round((HOURS.worked / HOURS.target) * 100);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/hr/attendance"
              aria-label="Back to attendance log"
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
        description={`${employee.employeeNumber} · ${employee.position} · ${employee.branchName}`}
        actions={
          <Link
            href={`/hr/employees/${employeeId}`}
            className="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 font-body-md text-body-md font-semibold text-primary-container transition-colors hover:bg-surface-container-low"
          >
            <Icon name="person" className="text-[18px]" />
            View Profile
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title={format(MONTH_ANCHOR, "MMMM yyyy")}
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Previous month"
                  className="rounded bg-surface-container p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
                >
                  <Icon name="chevron_left" className="text-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  className="rounded bg-surface-container p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
                >
                  <Icon name="chevron_right" className="text-[18px]" />
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="text-center font-table-header text-table-header uppercase text-outline"
                >
                  {weekday}
                </div>
              ))}

              {GRID_DAYS.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const tone: DayTone = isSameMonth(day, MONTH_ANCHOR)
                  ? (DAY_STATUS[key] ?? "off")
                  : "outside";

                return (
                  <div
                    key={key}
                    className={`flex aspect-square items-center justify-center rounded-lg border ${TONE[tone].cell}`}
                  >
                    <span className="font-body-md text-body-md font-medium tabular-nums">
                      {format(day, "d")}
                    </span>
                    <span className="sr-only">
                      {formatDate(key)} — {TONE[tone].label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 border-t border-row-line pt-4">
              {LEGEND.map((tone) => (
                <div key={tone} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`size-3 rounded border ${TONE[tone].swatch}`}
                  />
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    {TONE[tone].label}
                  </span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard
            title="Daily Log"
            action={
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-3 py-1 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-surface-container-low"
              >
                <Icon name="download" className="text-[18px]" />
                Export
              </button>
            }
          >
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
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface">
                  {DAILY_LOG.map((row) => {
                    const tone: DayTone = row.status === "LATE" ? "late" : "present";

                    return (
                      <tr key={row.date}>
                        <td className="py-3">{formatDate(row.date)}</td>
                        <td className="py-3 tabular-nums">
                          {formatTime(row.clockIn)}
                        </td>
                        <td className="py-3 tabular-nums">
                          {formatTime(row.clockOut)}
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          {formatDuration(row.minutesWorked)}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${TONE[tone].cell}`}
                          >
                            {TONE[tone].label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <BentoCard>
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="font-body-md text-body-md font-medium text-on-surface-variant">
                Hours This Month
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-soft text-primary-container">
                <Icon name="schedule" className="text-sm" />
              </span>
            </div>

            <p className="mb-4">
              <span className="font-card-stat text-card-stat tabular-nums text-on-surface">
                {formatDuration(HOURS.worked)}
              </span>
              <span className="ml-1 font-body-md text-body-md text-on-surface-variant">
                / {formatDuration(HOURS.target)}
              </span>
            </p>

            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(hoursPct, 100)}%` }}
              />
            </div>
            <p className="text-right text-[10px] text-on-surface-variant">
              {formatPercent(hoursPct)} of target — on track for month end
            </p>
          </BentoCard>

          <BentoCard title="Summary">
            <div className="flex flex-col gap-4">
              {SUMMARY.map((row) => (
                <div
                  key={row.tone}
                  className="flex items-center justify-between rounded-xl border border-row-line p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={`h-8 w-2 rounded-full border ${TONE[row.tone].swatch}`}
                    />
                    <span className="font-body-md text-body-md font-medium text-on-surface">
                      {TONE[row.tone].label}
                    </span>
                  </div>
                  <span className="font-card-stat text-[18px] font-bold tabular-nums text-on-surface">
                    {formatNumber(row.count)}
                  </span>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}
