import Link from "next/link";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AlertSpotlight } from "@/components/shared/alert-spotlight";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import {
  DonutChart,
  ProgressRows,
  type StackSegment,
} from "@/components/shared/charts";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { MetricCard } from "@/components/shared/metric-card";
import { Icon } from "@/components/ui/icon";
import {
  getAttendanceSummary,
  getAttendanceSyncFailures,
} from "@/lib/api/attendance";
import { getBranches } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { getPendingHrApprovals } from "@/lib/api/leave";
import {
  formatDateRange,
  formatNumber,
  formatPercent,
  initials,
} from "@/lib/format";
import type {
  AttendanceDashboardSummary,
  AttendanceSyncFailure,
  BranchResponse,
  EmployeeSummaryResponse,
  LeaveRequestResponse,
} from "@/types";

/**
 * HR Manager dashboard.
 *
 * There is **no `/dashboard/hr`** on the Spring side, so every figure here is
 * composed from reads that do exist rather than from one aggregate call. That
 * has three consequences worth stating plainly, because they explain why this
 * screen does not look exactly like the Stitch brief:
 *
 *  - **Headcount, the branch split and status split are assembled branch by
 *    branch** via `GET /employees/by-branch/{id}`, the same way `/hr/employees`
 *    does it — there is no company-wide employee list.
 *  - **The 7-day trend is seven calls** to `/attendance/dashboard/summary`, one
 *    per day. The endpoint reports one business day at a time; there is no
 *    range form.
 *  - **Two briefed widgets have no source at all and are gone**, not faked.
 *    "Probation Ending" needs a `dateHired` and a `PROBATION` status —
 *    `EmployeeSummaryResponse` carries neither, and `PROBATION` is not one of
 *    the three employment statuses the backend defines. "Docs Expiring" needs an
 *    expiry date, and `employee_documents` has no such column. Loans are absent
 *    for the same reason: no `/loans` endpoint admits HR.
 *
 * Every number on the page therefore comes from Postgres. When
 * `docs/backend-patches/HR_MANAGER_MISSING_ENDPOINTS.md` and
 * `HR_MANAGER_READ_ACCESS.md` land, the branch fan-out can collapse into a
 * single `GET /employees` call — the widgets themselves do not change.
 *
 * Layout follows the later of Stitch's two takes: spotlight, trend, donut. The
 * KPI row follows the earlier one, whose tiles are HR's own work queue.
 */

const TREND_DAYS = 7;

/** One colour per branch slice; wraps if a company has more branches than this. */
const SLICE_COLORS = [
  "var(--color-primary-container)",
  "var(--color-blue)",
  "var(--color-secondary)",
  "var(--color-tertiary)",
  "var(--color-amber-main)",
  "var(--color-orange)",
] as const;

/** Employment statuses in the order HR reads them, green → amber → red. */
const STATUS_ORDER = ["ACTIVE", "INACTIVE", "TERMINATED"] as const;

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "var(--color-green-main)",
  INACTIVE: "var(--color-amber-main)",
  TERMINATED: "var(--color-error)",
};

/** Days a request covers, inclusive of both ends. */
function daysCovered(request: LeaveRequestResponse): number {
  const days =
    differenceInCalendarDays(
      parseISO(request.endDate),
      parseISO(request.startDate),
    ) + 1;

  return Number.isFinite(days) && days > 0 ? days : 0;
}

/**
 * Count by employment status.
 *
 * Keyed off whatever the rows actually carry rather than off the union:
 * `employmentStatus` is a plain String in the backend, so a value outside
 * `EMPLOYMENT_STATUSES` is possible and must show up in the totals rather than
 * be dropped for not being in the type.
 */
function countByStatus(employees: EmployeeSummaryResponse[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const employee of employees) {
    const key = employee.employmentStatus || "UNKNOWN";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

/** Known statuses first, in `STATUS_ORDER`; anything else after, alphabetically. */
function orderedStatuses(counts: Map<string, number>): string[] {
  return [...counts.keys()].sort((a, b) => {
    const rankA = STATUS_ORDER.indexOf(a as (typeof STATUS_ORDER)[number]);
    const rankB = STATUS_ORDER.indexOf(b as (typeof STATUS_ORDER)[number]);
    return (rankA < 0 ? STATUS_ORDER.length : rankA) - (rankB < 0 ? STATUS_ORDER.length : rankB);
  });
}

export default async function HrDashboardPage() {
  await requirePermission("employee:read");

  // The trend runs oldest → newest, so the last element is today. Days are the
  // server's calendar days, not the company timezone's — the summary endpoint
  // resolves "today" itself when no date is passed, which is what the headline
  // tile uses. Across a midnight boundary the last bar and that tile can
  // disagree by one day; they cannot disagree about the figures.
  const days = Array.from({ length: TREND_DAYS }, (_, index) =>
    subDays(new Date(), TREND_DAYS - 1 - index),
  );

  let branches: BranchResponse[];
  let pendingLeave: LeaveRequestResponse[];
  let syncFailures: AttendanceSyncFailure[];
  let trend: AttendanceDashboardSummary[];

  try {
    [branches, pendingLeave, syncFailures, trend] = await Promise.all([
      getBranches(),
      getPendingHrApprovals(),
      getAttendanceSyncFailures(),
      Promise.all(
        days.map((day) =>
          getAttendanceSummary({ date: format(day, "yyyy-MM-dd") }),
        ),
      ),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="HR Dashboard"
        description="Headcount, attendance and the HR approval queue."
        subject="The dashboard"
        reason={
          error instanceof ApiError && error.isForbidden
            ? "Your role cannot read /branches yet, and the headcount figures are assembled branch by branch. See docs/backend-patches/HR_MANAGER_READ_ACCESS.md."
            : error instanceof ApiError
              ? error.message
              : undefined
        }
      />
    );
  }

  // One read per branch, concurrently. A branch that fails contributes no rows
  // rather than hiding every other branch's staff — the same contract
  // `/hr/employees` documents.
  const branchResults = await Promise.allSettled(
    branches.map((branch) => getEmployeesByBranch(branch.id)),
  );

  const everyBranchFailed =
    branchResults.length > 0 &&
    branchResults.every((result) => result.status === "rejected");

  if (everyBranchFailed) {
    const first = branchResults[0];

    return (
      <DataUnavailable
        title="HR Dashboard"
        description="Headcount, attendance and the HR approval queue."
        subject="The employee list"
        reason={
          first.status === "rejected" && first.reason instanceof ApiError
            ? first.reason.message
            : undefined
        }
      />
    );
  }

  const employees: EmployeeSummaryResponse[] = branchResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  const unreadBranches = branchResults.filter(
    (result) => result.status === "rejected",
  ).length;

  const headcount = employees.length;
  const today = trend[trend.length - 1];
  const hasAttendanceData = trend.some((day) => day.expectedEmployees > 0);

  const trendData: BarDatum[] = trend.map((day, index) => {
    const rate = Math.round(day.attendanceRatePercent);

    return {
      label: format(days[index], "EEE"),
      value: rate,
      tooltip: `${format(days[index], "d MMM")} · ${rate}% · ${day.reported} of ${day.expectedEmployees} reported`,
      highlight: index === trend.length - 1,
    };
  });

  const statusCounts = countByStatus(employees);
  const statusRows = orderedStatuses(statusCounts).map((status) => ({
    label: status === "UNKNOWN" ? "Not recorded" : status.charAt(0) + status.slice(1).toLowerCase(),
    value:
      headcount > 0
        ? Math.round(((statusCounts.get(status) ?? 0) / headcount) * 100)
        : 0,
    color: STATUS_COLORS[status] ?? "var(--color-outline)",
  }));

  // Branch slices, largest first, with everything past the palette grouped so
  // the legend stays readable on a company with more branches than colours.
  const byBranch = new Map<string, number>();
  for (const employee of employees) {
    const key = employee.branchName ?? "No branch";
    byBranch.set(key, (byBranch.get(key) ?? 0) + 1);
  }

  const ranked = [...byBranch.entries()].sort((a, b) => b[1] - a[1]);
  const named = ranked.slice(0, SLICE_COLORS.length - 1);
  const rest = ranked.slice(SLICE_COLORS.length - 1);

  const branchSlices: StackSegment[] = [
    ...named.map(([label, value], index) => ({
      label,
      value,
      color: SLICE_COLORS[index],
    })),
    ...(rest.length > 0
      ? [
          {
            label: `Other (${formatNumber(rest.length)})`,
            value: rest.reduce((sum, [, value]) => sum + value, 0),
            color: SLICE_COLORS[SLICE_COLORS.length - 1],
          },
        ]
      : []),
  ];

  const queue = pendingLeave.slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      {/* ───────────────────────────────── main column ─────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <MetricCard
            label="Pending Leave"
            value={formatNumber(pendingLeave.length)}
            icon="beach_access"
            tone="primary"
            accent={pendingLeave.length > 0}
            hint={
              pendingLeave.length > 0
                ? "Awaiting HR approval"
                : "Nothing in the queue"
            }
          />
          <MetricCard
            label="Headcount"
            value={formatNumber(headcount)}
            icon="groups"
            tone="tertiary"
            hint={
              unreadBranches > 0
                ? `${formatNumber(branches.length - unreadBranches)} of ${formatNumber(branches.length)} branches read`
                : `${formatNumber(branches.length)} ${branches.length === 1 ? "branch" : "branches"}`
            }
          />
          <MetricCard
            label="Attendance Today"
            value={formatPercent(today?.attendanceRatePercent ?? null)}
            icon="how_to_reg"
            tone="primary"
            hint={
              today
                ? `${formatNumber(today.reported)} of ${formatNumber(today.expectedEmployees)} reported`
                : "No data for today"
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <BentoCard
            title="Attendance Trend"
            subtitle={`Last ${TREND_DAYS} days`}
            action={
              <Link
                href="/hr/attendance"
                className="text-[10px] text-primary-container hover:underline"
              >
                View All
              </Link>
            }
            className="flex min-h-64 flex-col"
            bodyClassName="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2"
          >
            {hasAttendanceData ? (
              <BarChart
                data={trendData}
                max={100}
                axisLabels={["100", "66", "33", "0"]}
                tone="primary"
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <Icon
                  name="event_busy"
                  className="text-[36px] text-outline-variant"
                />
                <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                  No attendance has been recorded in the last {TREND_DAYS} days.
                </p>
                <p className="mt-1 text-[11px] text-outline">
                  A percentage needs someone expected before it can be worked
                  out, so an empty company reports nothing rather than 0%.
                </p>
              </div>
            )}
          </BentoCard>

          <BentoCard
            title="Employment Status"
            subtitle="Share of headcount"
            action={
              <Link
                href="/hr/employees"
                className="text-[10px] text-primary-container hover:underline"
              >
                Details
              </Link>
            }
            className="flex min-h-64 flex-col"
            bodyClassName="flex flex-1 flex-col"
          >
            {headcount > 0 ? (
              <ProgressRows rows={statusRows} className="flex-1" />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <Icon name="badge" className="text-[36px] text-outline-variant" />
                <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                  No employees on file yet.
                </p>
              </div>
            )}
          </BentoCard>
        </div>

        <BentoCard
          title="Leave Awaiting HR Approval"
          subtitle={
            pendingLeave.length > 0
              ? `${formatNumber(pendingLeave.length)} ${pendingLeave.length === 1 ? "request" : "requests"} cleared by a branch manager`
              : undefined
          }
          action={
            <Link
              href="/hr/leave"
              className="rounded px-3 py-1.5 text-[10px] font-semibold text-primary-container transition-colors hover:bg-blue-soft"
            >
              Review Queue
            </Link>
          }
        >
          {queue.length === 0 ? (
            <div className="rounded-card border border-dashed border-outline-variant px-4 py-10 text-center">
              <Icon
                name="check_circle"
                className="text-[36px] text-outline-variant"
              />
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                Nothing is waiting on HR.
              </p>
              <p className="mx-auto mt-1 max-w-md text-[11px] text-outline">
                A request only appears here once a branch manager has approved it
                — until then it is on their screen, and this queue is not the
                only place it can sit.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">
                        Employee
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Type
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Dates
                      </th>
                      <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">
                        Days
                      </th>
                      <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">
                        Review
                      </th>
                    </tr>
                  </thead>

                  <tbody className="font-body-md text-body-md">
                    {queue.map((request) => (
                      <tr key={request.id} className="group transition-colors">
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden
                              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-[10px] font-bold text-primary-container"
                            >
                              {initials(request.employeeName)}
                            </span>
                            <span className="font-medium text-on-surface">
                              {request.employeeName ?? "Unknown employee"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-on-surface-variant">
                          {request.leaveTypeName ?? "—"}
                        </td>
                        <td className="py-3 text-on-surface-variant">
                          {formatDateRange(request.startDate, request.endDate)}
                        </td>
                        <td className="py-3 text-right tabular-nums text-on-surface-variant">
                          {formatNumber(daysCovered(request))}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <Link
                            href={`/hr/leave/${request.id}`}
                            className="text-[11px] font-semibold text-primary-container hover:underline"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pendingLeave.length > queue.length ? (
                <p className="mt-3 border-t border-outline-variant/40 pt-3 text-[11px] text-outline">
                  Showing the first {queue.length} of{" "}
                  {formatNumber(pendingLeave.length)}.{" "}
                  <Link href="/hr/leave" className="text-primary-container hover:underline">
                    Review the rest on Leave
                  </Link>
                  .
                </p>
              ) : null}
            </>
          )}
        </BentoCard>
      </div>

      {/* ──────────────────────────────── side column ──────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-4">
        {/*
          One real message, chosen by precedence: a refused biometric scan is a
          clock-in that silently did not happen and leaves no attendance row, so
          it outranks a queue that is merely waiting. Both come from real reads;
          when neither has anything, the card says so rather than manufacturing
          an alert.
        */}
        {syncFailures.length > 0 ? (
          <AlertSpotlight
            eyebrow="Attendance Alert"
            tone="error"
            title={`${formatNumber(syncFailures.length)} ${syncFailures.length === 1 ? "scan was" : "scans were"} refused`}
            message="A rejected scan leaves no attendance row, so the employee shows as never having arrived."
            description={syncFailures[0]?.reason ?? undefined}
            cta="Review Attendance"
            href="/hr/attendance"
          />
        ) : pendingLeave.length > 0 ? (
          <AlertSpotlight
            eyebrow="Leave Queue"
            tone="warning"
            title={`${formatNumber(pendingLeave.length)} ${pendingLeave.length === 1 ? "request waits" : "requests wait"} on you`}
            message="Each one has cleared its branch manager and is stopped until HR decides."
            cta="Review Requests"
            href="/hr/leave"
          />
        ) : (
          <AlertSpotlight
            eyebrow="All Clear"
            tone="info"
            title="Nothing needs you"
            message="No leave is waiting on HR and no biometric scan has been refused."
            cta="Open Attendance"
            href="/hr/attendance"
          />
        )}

        <BentoCard
          title="Headcount by Branch"
          action={
            <Icon name="more_vert" className="text-sm text-on-surface-variant" />
          }
          className="flex flex-1 flex-col"
          bodyClassName="flex flex-1 flex-col justify-center"
        >
          {headcount > 0 ? (
            <DonutChart
              segments={branchSlices}
              size={160}
              legend="value"
              centerLabel="Total"
            />
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant">
              No employees on file yet.
            </p>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
