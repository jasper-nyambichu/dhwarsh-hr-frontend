import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AttendanceFilters } from "@/components/features/attendance/attendance-filters";
import { LiveAttendanceBoard } from "@/components/features/attendance/live-attendance-board";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import {
  getAttendanceActivity,
  getAttendanceDevices,
  getAttendanceRecords,
  getAttendanceSummary,
  getAttendanceSyncFailures,
} from "@/lib/api/attendance";
import {
  buildHref,
  first,
  parseDate,
  parseId,
  parsePage,
} from "@/lib/search-params";
import {
  formatDate,
  formatHours,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTime,
  initials,
} from "@/lib/format";
import type {
  AttendanceActivityItem,
  AttendanceDashboardSummary,
  AttendanceDeviceItem,
  AttendanceRecordItem,
  AttendanceSource,
  AttendanceSyncFailure,
  Paginated,
} from "@/types";

/**
 * The HR attendance board.
 *
 * Same endpoints and the same live components as `/admin/attendance` — HR is in
 * the backend's `VIEW_ROLES` on the summary, activity, records and devices
 * mappings, and in `ADMIN_ROLES` on sync-failures. The only real difference is
 * `basePath`, so `AttendanceFilters`, `LiveAttendanceBoard` and the records
 * table are shared rather than copied.
 *
 * What this screen deliberately does **not** have is any way to *correct* an
 * attendance row. There is no manual-entry or edit endpoint in
 * `AttendanceController` — the only writes are the biometric sync and the
 * checkout, both of which belong to the terminal. A "Add manual entry" button
 * would have nothing to call.
 *
 * The biometric module itself (`/hr/biometric`) is out of scope on purpose: the
 * terminals are enrolled and operated from the branch manager's desktop app.
 */

/** Mirrors the map on the admin board. */
const SOURCE_ICON: Record<AttendanceSource, string> = {
  BIOMETRIC: "fingerprint",
  MANUAL: "badge",
  MOBILE: "smartphone",
  WEB: "language",
};

/**
 * Only two tabs, because `openOnly` is the only server-side filter the records
 * endpoint has. A status filter would have to sift the current page in the
 * browser, which lies as soon as the results are paginated.
 */
const RECORD_TABS: readonly FilterTab[] = [
  { label: "All records" },
  { label: "On site now", value: "open" },
];

const RECORD_PAGE_SIZE = 25;

type BoardData = {
  summary: AttendanceDashboardSummary;
  activity: AttendanceActivityItem[];
  records: Paginated<AttendanceRecordItem>;
  devices: AttendanceDeviceItem[];
  syncFailures: AttendanceSyncFailure[];
};

/**
 * All five reads in one round trip, and all five or none.
 *
 * Deliberately not `allSettled`: a half-loaded board would render a live ticker
 * beside a records table that silently stopped at page one, and there is no way
 * for the reader to tell which of the two is wrong.
 */
async function loadBoard(filters: {
  date?: string;
  branchId?: number;
  openOnly: boolean;
  page: number;
}): Promise<BoardData> {
  const { date, branchId, openOnly, page } = filters;

  const [summary, activity, records, devices, syncFailures] = await Promise.all([
    getAttendanceSummary({ date, branchId }),
    getAttendanceActivity({ branchId, limit: 50 }),
    getAttendanceRecords({
      branchId,
      // Omitted when no date is chosen, which tells the backend "today" in the
      // company timezone rather than in the browser's.
      start: date,
      end: date,
      openOnly,
      page,
      size: RECORD_PAGE_SIZE,
    }),
    getAttendanceDevices({ branchId }),
    getAttendanceSyncFailures(),
  ]);

  return { summary, activity, records, devices, syncFailures };
}

export default async function HrAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    branchId?: string;
    date?: string;
    filter?: string;
    page?: string;
  }>;
}) {
  await requirePermission("attendance:read");

  const params = await searchParams;

  const branchId = parseId(first(params.branchId));
  const date = parseDate(first(params.date));
  const filter = first(params.filter);
  const openOnly = filter === "open";
  const page = parsePage(first(params.page));

  let data: BoardData;

  try {
    data = await loadBoard({ date, branchId, openOnly, page });
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="Attendance"
        description="Live clock-in and clock-out activity, branch by branch."
        subject="The attendance board"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const { summary, activity, records, devices, syncFailures } = data;
  const activeRate = summary.attendanceRatePercent;

  const filters = {
    branchId: branchId ? String(branchId) : undefined,
    date,
    filter,
  };

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Live clock-in and clock-out activity, branch by branch."
        pill={
          <CountPill
            label={`${formatPercent(activeRate)} reported`}
            tone={
              activeRate >= 85 ? "success" : activeRate > 0 ? "warning" : "neutral"
            }
          />
        }
        actions={
          <AttendanceFilters
            branches={summary.branches}
            branchId={branchId}
            date={date ?? summary.date}
            filter={filter}
            basePath="/hr/attendance"
          />
        }
      />

      <div className="flex flex-col gap-gutter">
        <LiveAttendanceBoard
          initialSnapshot={{
            summary,
            activity,
            fetchedAt: summary.generatedAt,
          }}
          branchId={branchId}
          recordsHref={buildHref("/hr/attendance", { ...filters, page: 0 })}
        />

        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
            <BentoCard
              title={
                <span className="flex items-center gap-2">
                  <Icon
                    name="table_view"
                    className="text-[18px] text-on-surface-variant"
                  />
                  {openOnly ? "On site now" : "Attendance records"}
                </span>
              }
              subtitle={`${formatDate(summary.date)} · ${formatNumber(
                records.totalElements,
              )} ${records.totalElements === 1 ? "record" : "records"}`}
              action={
                <FilterTabs
                  tabs={RECORD_TABS}
                  active={filter}
                  basePath="/hr/attendance"
                  preserve={{
                    branchId: branchId ? String(branchId) : undefined,
                    date,
                  }}
                />
              }
            >
              {records.content.length === 0 ? (
                <div className="rounded-card border border-dashed border-outline-variant px-4 py-12 text-center">
                  <Icon
                    name="event_busy"
                    className="text-[40px] text-outline-variant"
                  />
                  <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                    {openOnly
                      ? "Nobody is clocked in right now."
                      : "No attendance recorded for this day."}
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-[11px] text-outline">
                    Biometric events only reach this table once a branch terminal
                    is registered under Devices and each employee has enrolled a
                    fingerprint on it. Enrolment happens on the branch
                    manager&rsquo;s desktop app, not here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">
                          Employee
                        </th>
                        <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                          Branch
                        </th>
                        <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                          Position
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
                        <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="font-body-md text-body-md text-on-surface">
                      {records.content.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface-container-low/50"
                        >
                          <td className="py-3 pl-2 pr-3">
                            <Link
                              href={`/hr/attendance/${record.employeeId}`}
                              className="group flex items-center gap-3"
                            >
                              <span
                                aria-hidden
                                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-[10px] font-bold text-primary"
                              >
                                {initials(record.employeeName ?? "Unknown")}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-on-surface group-hover:text-primary">
                                  {record.employeeName ?? "Unknown employee"}
                                </span>
                                <span className="block text-[10px] text-outline">
                                  {record.employeeNumber ?? "—"}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-on-surface-variant">
                            {record.branchName ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-on-surface-variant">
                            {record.position ?? "—"}
                          </td>
                          <td className="px-3 py-3 tabular-nums text-on-surface-variant">
                            {formatTime(record.clockIn)}
                          </td>
                          <td className="px-3 py-3 tabular-nums text-on-surface-variant">
                            {formatTime(record.clockOut)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-on-surface-variant">
                            {formatHours(record.hoursWorked)}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className="flex items-center gap-1 text-outline"
                              title={record.source}
                            >
                              <Icon
                                name={SOURCE_ICON[record.source]}
                                className="text-[18px]"
                              />
                              <span className="sr-only">{record.source}</span>
                            </span>
                          </td>
                          <td className="py-3 pl-3 pr-2 text-right">
                            <StatusBadge status={record.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Pagination
                    data={records}
                    hrefFor={(target) =>
                      buildHref("/hr/attendance", { ...filters, page: target })
                    }
                    className="mt-4"
                  />
                </div>
              )}
            </BentoCard>
          </div>

          <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
            <BentoCard
              title={
                <span className="flex items-center gap-2">
                  <Icon name="fingerprint" className="text-[18px] text-on-surface-variant" />
                  Terminals
                </span>
              }
              action={
                <span className="font-body-md text-[11px] text-outline">
                  {formatNumber(devices.filter((device) => device.online).length)}{" "}
                  of {formatNumber(devices.length)} online
                </span>
              }
            >
              {devices.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No terminals registered
                  {branchId ? " for this branch" : ""}. Enrolment is done from the
                  branch manager&rsquo;s desktop app.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {devices.map((device) => (
                    <li
                      key={device.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-body-md text-body-md font-medium text-on-surface">
                          {device.deviceSerial}
                        </span>
                        <span className="block text-[11px] text-outline">
                          {device.branchName ?? `Branch #${device.branchId}`} ·{" "}
                          {device.lastSyncAt
                            ? `last sync ${formatRelativeTime(device.lastSyncAt)}`
                            : "never synced"}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          device.online
                            ? "bg-tertiary-container/15 text-tertiary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {device.online ? "Online" : "Offline"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </BentoCard>

            <BentoCard
              title={
                <span className="flex items-center gap-2">
                  <Icon name="report" className="text-[18px] text-on-surface-variant" />
                  Rejected Scans
                </span>
              }
              action={
                <span className="font-body-md text-[11px] text-outline">
                  Last {formatNumber(syncFailures.length)}
                </span>
              }
            >
              {syncFailures.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No scan has been refused. This list is the only place a clock-in
                  that silently did not happen shows up — a rejected event leaves
                  no row in the attendance table.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {syncFailures.slice(0, 8).map((failure) => (
                    <li
                      key={failure.id}
                      className="border-b border-outline-variant/20 pb-3 last:border-0 last:pb-0"
                    >
                      <p className="font-body-md text-body-md font-medium text-on-surface">
                        {failure.employeeName ??
                          failure.deviceSerial ??
                          "Unknown source"}
                      </p>
                      <p className="mt-0.5 font-body-md text-[11px] text-on-surface-variant">
                        {failure.reason}
                      </p>
                      <p className="mt-0.5 text-[10px] text-outline">
                        {formatRelativeTime(failure.createdAt)} · event{" "}
                        <span className="font-mono">{failure.eventId}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </BentoCard>
          </div>
        </div>
      </div>
    </>
  );
}
