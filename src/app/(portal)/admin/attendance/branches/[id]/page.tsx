import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AttendanceAutoRefresh } from "@/components/features/attendance/attendance-auto-refresh";
import { AttendanceFilters } from "@/components/features/attendance/attendance-filters";
import { AttendanceStatisticCard, AttendanceTiles, TerminalsBanner } from "@/components/features/attendance/attendance-panels";
import { LiveActivityCard } from "@/components/features/attendance/live-attendance-board";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import {
  getAttendanceActivity,
  getAttendanceDevices,
  getAttendanceRecords,
  getAttendanceSummary,
  getAttendanceSyncFailures,
} from "@/lib/api/attendance";
import { getBranch } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { getOffDays } from "@/lib/api/off-day";
import { formatDate, formatHours, formatNumber, formatRelativeTime, formatTime, initials } from "@/lib/format";
import { first, parseDate } from "@/lib/search-params";
import type { AttendanceRecordItem } from "@/types";

const RECORD_PAGE_SIZE = 100;
/** A branch has far fewer scans than this in a day; it only stops a runaway loop. */
const MAX_RECORD_PAGES = 10;

async function allRecords(branchId: number, date: string): Promise<AttendanceRecordItem[]> {
  const records: AttendanceRecordItem[] = [];
  for (let page = 0; page < MAX_RECORD_PAGES; page++) {
    const result = await getAttendanceRecords({ branchId, start: date, end: date, page, size: RECORD_PAGE_SIZE });
    records.push(...result.content);
    if (result.last) break;
  }
  return records;
}

type Row = {
  key: string;
  employeeId: number;
  name: string;
  code: string | null;
  record: AttendanceRecordItem | null;
  /** Given a day off and did not scan. Someone who scanned anyway counts as attended. */
  off: boolean;
};

function NoScanBadge({ off, label, offLabel }: { off: boolean; label: string; offLabel: string }) {
  return off ? (
    <span className="shrink-0 rounded-full bg-blue-soft px-2 py-0.5 text-[11px] font-medium text-primary-container">{offLabel}</span>
  ) : (
    <span className="shrink-0 rounded-full bg-amber-main/10 px-2 py-0.5 text-[11px] font-medium text-amber-main">{label}</span>
  );
}

/** Attendance inside one branch: everyone who works here, with who came and when. */
export default async function BranchAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; filter?: string }>;
}) {
  await requirePermission("attendance:read");

  const branchId = Number((await params).id);
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();

  const query = await searchParams;
  const requestedDate = parseDate(first(query.date));
  const filter = first(query.filter);

  let data;
  try {
    const [branch, summary, todaySummary, employees, activity, devices, failures] = await Promise.all([
      getBranch(branchId),
      getAttendanceSummary({ date: requestedDate, branchId }),
      requestedDate ? getAttendanceSummary({ branchId }) : null,
      getEmployeesByBranch(branchId),
      getAttendanceActivity({ branchId, limit: 50 }),
      getAttendanceDevices({ branchId }),
      getAttendanceSyncFailures(),
    ]);
    const [records, offDays] = await Promise.all([
      allRecords(branchId, summary.date),
      getOffDays({ from: summary.date, to: summary.date }),
    ]);
    data = { branch, summary, today: (todaySummary ?? summary).date, employees, activity, devices, failures, records, offDays };
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");
    if (error instanceof ApiError && error.isNotFound) notFound();
    return <DataUnavailable title="Branch attendance" subject="This branch's attendance" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const { branch, summary, today, employees, activity, devices, failures, records, offDays } = data;
  const live = summary.date === today;
  const snapshot = { summary, activity, fetchedAt: summary.generatedAt };
  const absentLabel = live ? "Not yet in" : "Did not report";
  const offLabel = live ? "Off today" : "Off day";
  const basePath = `/admin/attendance/branches/${branchId}`;

  // Everyone who works here, whether or not they scanned, so nobody can be missed.
  const scanned = new Set(records.map((record) => record.employeeId));
  const onOffDay = new Set(offDays.map((offDay) => offDay.employeeId));
  const allRows: Row[] = [
    ...records.map((record) => ({
      key: `record-${record.id}`,
      employeeId: record.employeeId,
      name: record.employeeName ?? "Unknown employee",
      code: record.employeeNumber,
      record,
      off: false,
    })),
    ...employees
      .filter((employee) => employee.employmentStatus === "ACTIVE" && !scanned.has(employee.id))
      .map((employee) => ({
        key: `employee-${employee.id}`,
        employeeId: employee.id,
        name: employee.fullName,
        code: employee.employeeNumber,
        record: null,
        off: onOffDay.has(employee.id),
      })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const onSite = allRows.filter((row) => row.record && !row.record.clockOut);
  const left = allRows.filter((row) => row.record?.clockOut);
  const absent = allRows.filter((row) => !row.record && !row.off);
  const off = allRows.filter((row) => row.off);
  const rows = filter === "open" ? onSite : filter === "out" ? left : filter === "none" ? absent : filter === "off" ? off : allRows;

  const serials = new Set(devices.map((device) => device.deviceSerial));
  const branchFailures = failures.filter((failure) => failure.deviceSerial && serials.has(failure.deviceSerial)).slice(0, 5);
  const dateParam = live ? undefined : summary.date;
  const lastScan = summary.branches.find((item) => item.branchId === branchId)?.lastActivityAt;
  const header = "whitespace-nowrap pb-3 pl-4 font-table-header text-table-header uppercase text-outline";

  return (
    <>
      {live ? <AttendanceAutoRefresh /> : null}

      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Link
              href={live ? "/admin/attendance" : `/admin/attendance?date=${summary.date}`}
              aria-label="Back to all branches"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            <span className="min-w-0 break-words">{branch.name}</span>
          </span>
        }
        actions={<AttendanceFilters branches={[]} date={summary.date} filter={filter} basePath={basePath} showBranch={false} clearable={!live} />}
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-gutter lg:col-span-7">
          <BentoCard title="This branch" action={<span className="text-xs text-on-surface-variant">{formatDate(summary.date)}</span>}>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-[10px] uppercase text-outline">Branch code</dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-on-surface">{branch.code}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase text-outline">Manager</dt>
                <dd className="mt-1 break-words text-sm font-semibold text-on-surface">{branch.managerName ?? "Unassigned"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase text-outline">Last scan</dt>
                <dd className="mt-1 text-sm font-semibold text-on-surface">{lastScan ? formatRelativeTime(lastScan) : "None"}</dd>
              </div>
            </dl>
          </BentoCard>

          <BentoCard title="Employees" subtitle={`${formatNumber(rows.length)} shown`}>
            <FilterTabs
              className="mb-4"
              basePath={basePath}
              active={filter}
              preserve={{ date: dateParam }}
              tabs={[
                { label: "All", count: allRows.length },
                { label: "On site", value: "open", count: onSite.length },
                { label: "Clocked out", value: "out", count: left.length },
                { label: absentLabel, value: "none", count: absent.length },
                { label: offLabel, value: "off", count: off.length },
              ]}
            />

            {rows.length === 0 ? (
              <EmptyState symbol="group_off" title="Nobody here" description="No employee in this branch matches this view." />
            ) : (
              <>
                <ul className="flex flex-col gap-3 md:hidden">
                  {rows.map((row) => (
                    <li key={row.key} className="min-w-0 rounded-lg border border-outline-variant/40 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary">
                          {initials(row.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold text-on-surface">{row.name}</p>
                          <p className="font-mono text-[10px] text-outline">{row.code ?? "—"}</p>
                        </div>
                        {row.record ? (
                          <StatusBadge status={row.record.status} />
                        ) : (
                          <NoScanBadge off={row.off} label={absentLabel} offLabel={offLabel} />
                        )}
                      </div>
                      {row.record ? (
                        <dl className="mt-2 grid grid-cols-3 gap-2 border-t border-outline-variant/30 pt-2 text-xs">
                          <div><dt className="text-outline">In</dt><dd className="tabular-nums text-on-surface">{formatTime(row.record.clockIn)}</dd></div>
                          <div><dt className="text-outline">Out</dt><dd className="tabular-nums text-on-surface">{formatTime(row.record.clockOut)}</dd></div>
                          <div><dt className="text-outline">Hours</dt><dd className="tabular-nums text-on-surface">{formatHours(row.record.hoursWorked)}</dd></div>
                        </dl>
                      ) : null}
                    </li>
                  ))}
                </ul>

                <div className="hidden w-full overflow-x-auto md:block">
                  <table className="data-table w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th className={`${header} !pl-2`}>Employee</th>
                        <th className={header}>In</th>
                        <th className={header}>Out</th>
                        <th className={`${header} text-right`}>Hours</th>
                        <th className={`${header} pr-2 text-right`}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-md text-body-md text-on-surface">
                      {rows.map((row) => (
                        <tr key={row.key} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface">
                          <td className="py-3 pl-2">
                            <span className="flex min-w-0 items-center gap-3">
                              <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary">
                                {initials(row.name)}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-medium">{row.name}</span>
                                <span className="block font-mono text-[10px] text-outline">{row.code ?? "—"}</span>
                              </span>
                            </span>
                          </td>
                          <td className="py-3 pl-4 tabular-nums">{row.record ? formatTime(row.record.clockIn) : "—"}</td>
                          <td className="py-3 pl-4 tabular-nums text-outline">{row.record ? formatTime(row.record.clockOut) : "—"}</td>
                          <td className="whitespace-nowrap py-3 pl-4 text-right tabular-nums">{row.record ? formatHours(row.record.hoursWorked) : "—"}</td>
                          <td className="whitespace-nowrap py-3 pl-4 pr-2 text-right">
                            {row.record ? (
                              <StatusBadge status={row.record.status} />
                            ) : (
                              <NoScanBadge off={row.off} label={absentLabel} offLabel={offLabel} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </BentoCard>
        </div>

        <div className="flex min-w-0 flex-col gap-gutter lg:col-span-5">
          <AttendanceStatisticCard initialSnapshot={snapshot} branchId={branchId} live={live} />
          <AttendanceTiles initialSnapshot={snapshot} branchId={branchId} live={live} />
          <TerminalsBanner initialSnapshot={snapshot} branchId={branchId} live={live} />

          {branchFailures.length > 0 ? (
            <BentoCard title="Rejected scans" subtitle="Scans at this branch that were refused">
              <ul className="flex flex-col gap-3">
                {branchFailures.map((failure) => (
                  <li key={failure.id} className="min-w-0 rounded-lg border border-error/20 bg-error/5 p-3">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <span className="min-w-0 break-words text-[11px] font-semibold text-on-surface">{failure.employeeName ?? failure.deviceSerial ?? "Unknown terminal"}</span>
                      <span className="shrink-0 text-[10px] text-outline">{formatRelativeTime(failure.createdAt)}</span>
                    </div>
                    <p className="mt-1 break-words text-[11px] text-error">{failure.reason}</p>
                  </li>
                ))}
              </ul>
            </BentoCard>
          ) : null}

          {live ? <LiveActivityCard initialSnapshot={snapshot} branchId={branchId} /> : null}
        </div>
      </div>
    </>
  );
}
