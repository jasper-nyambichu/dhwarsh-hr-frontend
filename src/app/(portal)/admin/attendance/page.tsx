import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AttendanceFilters } from "@/components/features/attendance/attendance-filters";
import { LiveAttendanceBoard } from "@/components/features/attendance/live-attendance-board";
import { BentoCard } from "@/components/shared/bento-card";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { CountPill, PageHeader } from "@/components/shared/page-header";
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
 * Company-wide attendance board for SUPER_ADMIN and ADMIN.
 *
 * This is the screen the biometric chain was built for: an employee
 * fingerprints at a branch terminal, HrpayrollDesktop pushes the event to
 * `POST /attendance/biometric/sync`, and it surfaces here — the tiles and the
 * activity feed live (see `LiveAttendanceBoard`), the records table and the
 * device fleet on the server-rendered pass.
 *
 * Read-only by design. Corrections, manual entries and device enrolment belong
 * on the HR surfaces; an admin console that silently wrote attendance rows
 * would be a second source of truth for the same table.
 *
 * Every figure comes from `controller/attendance/AttendanceDashboardController`.
 * Nothing here is placeholder data.
 */

/** Mirrors the icon map on the HR attendance screen. */
const SOURCE_ICON: Record<AttendanceSource, string> = {
  BIOMETRIC: "fingerprint",
  MANUAL: "badge",
  MOBILE: "smartphone",
  WEB: "language",
};

/**
 * Only two tabs, because the backend exposes one boolean: `openOnly`.
 * A "Completed" tab would have to filter the current page in the browser, which
 * lies as soon as the results are paginated.
 */
const RECORD_TABS: readonly FilterTab[] = [
  { label: "All records" },
  { label: "On site now", value: "open" },
];

const RECORD_PAGE_SIZE = 25;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseBranchId(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/** `yyyy-MM-dd` only. The backend rejects anything else with a 400. */
function parseDate(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

/** Rebuilds the query string for a records-table page link. */
function pageHref(
  page: number,
  filters: { branchId?: number; date?: string; filter?: string },
): string {
  const params = new URLSearchParams();
  if (filters.branchId) params.set("branchId", String(filters.branchId));
  if (filters.date) params.set("date", filters.date);
  if (filters.filter) params.set("filter", filters.filter);
  if (page > 0) params.set("page", String(page));

  const query = params.toString();
  return query ? `/admin/attendance?${query}` : "/admin/attendance";
}

type BoardData = {
  summary: AttendanceDashboardSummary;
  activity: AttendanceActivityItem[];
  records: Paginated<AttendanceRecordItem>;
  devices: AttendanceDeviceItem[];
  syncFailures: AttendanceSyncFailure[];
};

/**
 * All five reads in one round trip.
 *
 * `sync-failures` is restricted to ADMIN_ROLES on the backend while the other
 * four are open to VIEW_ROLES — which is the same set here, because this route
 * only ever renders for SUPER_ADMIN and ADMIN. If that ever diverges, this is
 * the call that starts throwing 403 and takes the whole board down with it.
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

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    branchId?: string;
    date?: string;
    filter?: string;
    page?: string;
  }>;
}) {
  // SUPER_ADMIN and ADMIN both hold `attendance:read`; anyone else is bounced
  // to their own namespace before a single figure renders.
  await requirePermission("attendance:read");

  // searchParams is a Promise in Next.js 16 — it must be awaited.
  const params = await searchParams;

  const branchId = parseBranchId(first(params.branchId));
  const date = parseDate(first(params.date));
  const filter = first(params.filter);
  const openOnly = filter === "open";
  const page = parsePage(first(params.page));

  let data: BoardData;

  try {
    data = await loadBoard({ date, branchId, openOnly, page });
  } catch (error) {
    // A spent session is a session, not an error page. `api-client` has already
    // tried the refresh once, so a 401 here means the refresh token is gone too.
    if (error instanceof ApiError && error.isUnauthorized) {
      redirect("/login");
    }

    // Anything else — the backend being down is the common case — keeps the
    // page chrome and says what actually went wrong. The portal error boundary
    // deliberately hides `message`, which is the wrong trade for a dev-stage
    // service that is simply not running.
    const message =
      error instanceof ApiError
        ? error.message
        : "Unable to reach the attendance service.";

    return <LoadFailure message={message} />;
  }

  const { summary, activity, records, devices, syncFailures } = data;
  // Always page 1: "full log" means "start from the top", not "reopen whichever
  // page the records table happens to be on".
  const recordsHref = pageHref(0, { branchId, date });
  const activeRate = summary.attendanceRatePercent;

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Live biometric clock-in and clock-out activity across every branch."
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
          recordsHref={recordsHref}
        />

        <div className="grid grid-cols-12 gap-gutter">
          {/* ───────────────────────────── main column ───────────────────── */}
          <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
            <BentoCard
              title={
                <span className="flex items-center gap-2">
                  <Icon name="table_view" className="text-[18px] text-on-surface-variant" />
                  {openOnly ? "On site now" : "Attendance records"}
                </span>
              }
              subtitle={`${formatDate(summary.date)} · ${formatNumber(records.totalElements)} ${
                records.totalElements === 1 ? "record" : "records"
              }`}
              action={
                <FilterTabs
                  tabs={RECORD_TABS}
                  active={filter}
                  basePath="/admin/attendance"
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
                  {/* The likeliest reason on a fresh install is that the
                      terminal has nothing to report with, not that nobody
                      showed up. */}
                  <p className="mx-auto mt-1 max-w-md text-[11px] text-outline">
                    Biometric events only reach this table once the branch
                    terminal is registered under Devices and each employee has
                    enrolled a fingerprint on it.
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
                        <tr key={record.id} className="transition-colors">
                          <td className="py-3 pl-2">
                            <span className="flex items-center gap-3">
                              <span
                                aria-hidden
                                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary"
                              >
                                {initials(record.employeeName)}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-medium">
                                  {record.employeeName ?? "Unknown employee"}
                                </span>
                                <span className="block text-[10px] text-outline">
                                  {record.employeeNumber ?? "—"}
                                </span>
                              </span>
                            </span>
                          </td>
                          <td className="py-3 text-on-surface-variant">
                            {record.branchName ?? "—"}
                          </td>
                          <td className="py-3 text-on-surface-variant">
                            {record.position ?? "—"}
                          </td>
                          <td className="py-3 tabular-nums">
                            {formatTime(record.clockIn)}
                          </td>
                          <td className="py-3 tabular-nums text-outline">
                            {formatTime(record.clockOut)}
                          </td>
                          <td className="py-3 text-right tabular-nums">
                            {formatHours(record.hoursWorked)}
                          </td>
                          <td className="py-3">
                            <span
                              className="flex items-center gap-1 text-outline"
                              title={record.source.toLowerCase()}
                            >
                              <Icon
                                name={SOURCE_ICON[record.source]}
                                className="text-[18px]"
                              />
                              <span className="sr-only">
                                {record.source.toLowerCase()}
                              </span>
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <StatusBadge status={record.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination is links, not buttons: the page number belongs
                      in the URL like every other filter on this screen. */}
                  {records.totalPages > 1 ? (
                    <div className="mt-4 flex items-center justify-between border-t border-outline-variant/40 pt-4 text-[11px] text-on-surface-variant">
                      <span>
                        Page {formatNumber(records.pageNumber + 1)} of{" "}
                        {formatNumber(records.totalPages)}
                      </span>

                      <div className="flex items-center gap-1">
                        {records.pageNumber > 0 ? (
                          <Link
                            href={pageHref(records.pageNumber - 1, {
                              branchId,
                              date,
                              filter,
                            })}
                            className="rounded-md px-2.5 py-1 transition-colors hover:bg-surface-container-low"
                          >
                            Previous
                          </Link>
                        ) : null}

                        {!records.last ? (
                          <Link
                            href={pageHref(records.pageNumber + 1, {
                              branchId,
                              date,
                              filter,
                            })}
                            className="rounded-md px-2.5 py-1 transition-colors hover:bg-surface-container-low"
                          >
                            Next
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </BentoCard>
          </div>

          {/* ──────────────────────────── side column ────────────────────── */}
          <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
            <BentoCard
              title={
                <span className="flex items-center gap-2">
                  <Icon name="dns" className="text-[18px] text-on-surface-variant" />
                  Terminals
                </span>
              }
              subtitle={`${formatNumber(summary.devicesOnline)} of ${formatNumber(summary.devicesTotal)} reporting`}
            >
              {devices.length === 0 ? (
                <p className="py-6 text-center font-body-md text-body-md text-outline">
                  No terminals registered for this branch yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {devices.map((device) => (
                    <li
                      key={device.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden
                          className={`size-2 shrink-0 rounded-full ${
                            device.online ? "bg-green-main" : "bg-outline-variant"
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[11px] text-on-surface">
                            {device.deviceSerial}
                          </span>
                          <span className="block truncate text-[10px] text-outline">
                            {device.branchName ?? "Unassigned"}
                          </span>
                        </span>
                      </span>

                      <span className="shrink-0 text-right text-[10px] text-on-surface-variant">
                        {device.online ? (
                          <span className="font-semibold text-green-main">
                            Online
                          </span>
                        ) : (
                          formatRelativeTime(device.lastSyncAt)
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </BentoCard>

            <BentoCard
              title={
                <span
                  className={
                    syncFailures.length > 0
                      ? "flex items-center gap-2 text-error"
                      : "flex items-center gap-2 text-on-surface"
                  }
                >
                  <Icon name="sync_problem" className="text-[18px]" />
                  Rejected Scans
                </span>
              }
              subtitle="Scans the backend refused"
            >
              {syncFailures.length === 0 ? (
                <p className="py-6 text-center font-body-md text-body-md text-outline">
                  No rejected scans.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {syncFailures.slice(0, 8).map((failure) => (
                    <li
                      key={failure.id}
                      className="rounded-lg border border-error/20 bg-error/5 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 truncate text-[11px] font-semibold text-on-surface">
                          {failure.employeeName ??
                            failure.deviceSerial ??
                            "Unknown terminal"}
                        </span>
                        <span className="shrink-0 text-[10px] text-outline">
                          {formatRelativeTime(failure.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-error">
                        {failure.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {syncFailures.length > 0 ? (
                <p className="mt-3 text-[10px] text-outline">
                  A rejected scan leaves no attendance row. Reprovision the
                  employee on the terminal, then have them scan again.
                </p>
              ) : null}
            </BentoCard>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Shown when the API cannot be reached at all.
 *
 * Deliberately keeps the page header's slot empty rather than rendering a
 * half-populated board: a dashboard that shows zeros because the backend is
 * down reads exactly like a dashboard that shows zeros because nobody came to
 * work, and an administrator will act on the second reading.
 */
function LoadFailure({ message }: { message: string }) {
  return (
    <>
      <PageHeader
        title="Attendance"
        description="Live biometric clock-in and clock-out activity across every branch."
      />

      <div className="rounded-card border border-dashed border-error/40 bg-error/5 p-8 text-center">
        <Icon name="cloud_off" className="text-[40px] text-error" />
        <p className="mt-3 font-body-md text-body-md font-semibold text-on-surface">
          Attendance could not be loaded
        </p>
        <p className="mx-auto mt-1 max-w-md font-body-md text-body-md text-on-surface-variant">
          {message}
        </p>
        <p className="mx-auto mt-3 max-w-md text-[11px] text-outline">
          Check that the backend is running and that <code>API_BASE_URL</code> in{" "}
          <code>.env.local</code> matches the port it listens on.
        </p>
      </div>
    </>
  );
}
