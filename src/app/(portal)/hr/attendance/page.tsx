import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { SegmentStrip, type Segment } from "@/components/shared/segment-strip";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatTime,
  humanizeEnum,
  initials,
} from "@/lib/format";
import type { AttendanceSource, AttendanceStatus } from "@/types";

/**
 * Daily attendance log — every clock event for one date, across all branches.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — no `/attendance` endpoint wired yet. Replace with
 * `await api.get<Paginated<Attendance>>("/attendance", { date, status })`
 * when it lands; the row shape below is already `Attendance`-compatible.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** The date being viewed. Becomes a `?date=` search param once wired. */
const LOG_DATE = "2026-08-09";

type LogRow = {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeNumber: string;
  branchName: string;
  shift: string;
  clockIn: string | null;
  clockOut: string | null;
  /** Minutes between clock-in and clock-out. `null` while still on shift. */
  minutesWorked: number | null;
  source: AttendanceSource;
  status: AttendanceStatus;
};

const TODAY_LOG: readonly LogRow[] = [
  {
    id: 1,
    employeeId: 1,
    employeeName: "Peter Njuguna",
    employeeNumber: "EMP-00412",
    branchName: "Nairobi CBD",
    shift: "Day",
    clockIn: "08:55:00",
    clockOut: null,
    minutesWorked: null,
    source: "BIOMETRIC",
    status: "PRESENT",
  },
  {
    id: 2,
    employeeId: 2,
    employeeName: "Grace Wambui",
    employeeNumber: "EMP-00318",
    branchName: "Nairobi CBD",
    shift: "Day",
    clockIn: "09:15:00",
    clockOut: null,
    minutesWorked: null,
    source: "MANUAL",
    status: "LATE",
  },
  {
    id: 3,
    employeeId: 3,
    employeeName: "Ali Hassan",
    employeeNumber: "EMP-00127",
    branchName: "Mombasa Port",
    shift: "Night",
    clockIn: "19:58:00",
    clockOut: "05:02:00",
    minutesWorked: 544,
    source: "BIOMETRIC",
    status: "PRESENT",
  },
  {
    id: 4,
    employeeId: 4,
    employeeName: "Jane Otieno",
    employeeNumber: "EMP-00641",
    branchName: "Kisumu Industrial",
    shift: "Day",
    clockIn: null,
    clockOut: null,
    minutesWorked: null,
    source: "WEB",
    status: "ON_LEAVE",
  },
  {
    id: 5,
    employeeId: 5,
    employeeName: "Eunice Wanjiku",
    employeeNumber: "EMP-00509",
    branchName: "Thika Road",
    shift: "Day",
    clockIn: null,
    clockOut: null,
    minutesWorked: null,
    source: "BIOMETRIC",
    status: "ABSENT",
  },
];

const SUMMARY: readonly Segment[] = [
  { label: "Present", value: formatNumber(420) },
  { label: "Late", value: formatNumber(12), tone: "warning" },
  { label: "Absent", value: formatNumber(8), tone: "error" },
];

const REPEAT_LATE = [
  { id: 1, employeeId: 2, name: "Grace Wambui", occurrences: 3 },
  { id: 2, employeeId: 7, name: "David Kimani", occurrences: 3 },
  { id: 3, employeeId: 9, name: "Mercy Chebet", occurrences: 2 },
] as const;

/** Which glyph stands for each capture channel in the Source column. */
const SOURCE_ICON: Record<AttendanceSource, string> = {
  BIOMETRIC: "fingerprint",
  MANUAL: "badge",
  MOBILE: "smartphone",
  WEB: "language",
};

const TABS: readonly FilterTab[] = [
  { label: "All" },
  { label: "Present", value: "PRESENT" },
  { label: "Late", value: "LATE" },
  { label: "Absent", value: "ABSENT" },
  { label: "On Leave", value: "ON_LEAVE" },
];

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requirePermission("attendance:read");
  const { filter } = await searchParams;

  // The tab is a real filter, not decoration — it lives in the URL so a
  // filtered log is shareable and survives a refresh.
  const rows = filter
    ? TODAY_LOG.filter((row) => row.status === filter)
    : TODAY_LOG;

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Every clock event for the selected day, across all branches."
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 transition-colors hover:bg-surface-container-low"
          >
            <Icon name="calendar_month" className="text-[18px] text-primary" />
            <span className="font-body-md text-body-md text-on-surface">
              {formatDate(LOG_DATE)}
            </span>
            <Icon name="expand_more" className="text-[18px] text-outline" />
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <FilterTabs
            tabs={TABS}
            active={filter}
            basePath="/hr/attendance"
            className="no-scrollbar overflow-x-auto"
          />

          <BentoCard
            title="Today's Log"
            subtitle={`${formatNumber(rows.length)} shown · ${formatNumber(TODAY_LOG.length)} total`}
            action={
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-3 py-1 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-surface-container-low"
              >
                <Icon name="download" className="text-[18px]" />
                Export
              </button>
            }
            className="flex-1"
          >
            <div className="overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                      Employee
                    </th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                      Branch
                    </th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                      Shift
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
                  {rows.map((row) => (
                    <tr key={row.id} className="transition-colors">
                      <td className="py-3">
                        <Link
                          href={`/hr/attendance/${row.employeeId}`}
                          className="group flex items-center gap-3"
                        >
                          <span
                            aria-hidden
                            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary"
                          >
                            {initials(row.employeeName)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-on-surface group-hover:text-primary-container">
                              {row.employeeName}
                            </span>
                            <span className="block text-[10px] text-outline">
                              {row.employeeNumber}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-3">{row.branchName}</td>
                      <td className="py-3">{row.shift}</td>
                      <td
                        className={
                          row.status === "LATE"
                            ? "py-3 tabular-nums text-error"
                            : "py-3 tabular-nums"
                        }
                      >
                        {formatTime(row.clockIn)}
                      </td>
                      <td className="py-3 tabular-nums text-outline">
                        {formatTime(row.clockOut)}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {formatDuration(row.minutesWorked)}
                      </td>
                      <td className="py-3">
                        <span
                          className="flex items-center gap-1 text-outline"
                          title={humanizeEnum(row.source)}
                        >
                          <Icon
                            name={SOURCE_ICON[row.source]}
                            className="text-[18px]"
                          />
                          <span className="sr-only">
                            {humanizeEnum(row.source)}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length === 0 ? (
                <div className="mt-4 rounded-card border border-dashed border-outline-variant p-12 text-center">
                  <Icon
                    name="event_busy"
                    className="text-[40px] text-outline-variant"
                  />
                  <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                    No attendance records match this filter.
                  </p>
                </div>
              ) : null}
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <SegmentStrip segments={SUMMARY} />

          <BentoCard title="Repeat Late" subtitle="This week">
            <ul className="flex flex-col gap-3">
              {REPEAT_LATE.map((person) => (
                <li key={person.id}>
                  <Link
                    href={`/hr/attendance/${person.employeeId}`}
                    className="group -mx-2 flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-surface-container-low"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary"
                      >
                        {initials(person.name)}
                      </span>
                      <span className="truncate font-body-md text-body-md text-on-surface group-hover:text-primary-container">
                        {person.name}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-md bg-error-container px-2 py-1 text-[10px] font-bold tabular-nums text-on-error-container">
                      {person.occurrences} times
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </BentoCard>
        </div>
      </div>
    </>
  );
}
