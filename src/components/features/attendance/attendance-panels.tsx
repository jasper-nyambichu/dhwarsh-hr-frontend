"use client";

import Link from "next/link";

import { useLiveAttendance } from "@/components/features/attendance/live-attendance-board";
import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatNumber, formatPercent, formatTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceBranchSummary, AttendanceLiveSnapshot } from "@/types";

type LiveProps = {
  initialSnapshot: AttendanceLiveSnapshot;
  /** Undefined means every branch. */
  branchId?: number;
  /** False on a past date: those figures are final and are not polled. */
  live: boolean;
};

/** A bar of who is in, who has left and who has not come, with the same figures under it. */
export function AttendanceStatisticCard({ initialSnapshot, branchId, live }: LiveProps) {
  const { summary } = useLiveAttendance(initialSnapshot, branchId, live).data;
  const total = summary.currentlyIn + summary.clockedOut + summary.notYetIn;
  const width = (value: number) => (total > 0 ? `${(value / total) * 100}%` : "0%");

  const parts = [
    { label: "On site", value: summary.currentlyIn, bar: "bg-primary-container" },
    { label: "Clocked out", value: summary.clockedOut, bar: "bg-outline-variant" },
    { label: live ? "Not yet in" : "Did not report", value: summary.notYetIn, bar: "bg-amber-main" },
  ];

  return (
    <BentoCard
      title="Attendance statistic"
      action={<span className="text-xs font-semibold text-primary">{formatPercent(summary.attendanceRatePercent)} reported</span>}
    >
      <div className="rounded-lg border border-outline-variant/40 p-3 sm:p-4">
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-container-low">
          {parts.map((part) => (
            <div key={part.label} className={part.bar} style={{ width: width(part.value) }} />
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2">
          {parts.map((part) => (
            <div key={part.label} className="min-w-0">
              <dt className="flex items-start gap-1.5 text-[10px] uppercase text-outline">
                <span aria-hidden className={cn("mt-0.5 size-2 shrink-0 rounded-full", part.bar)} />
                {part.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-on-surface">{formatNumber(part.value)}</dd>
            </div>
          ))}
        </dl>
        {summary.offToday > 0 ? (
          <p className="mt-3 border-t border-outline-variant/30 pt-2 text-xs text-on-surface-variant">
            {formatNumber(summary.offToday)} on an off day, not counted as expected
          </p>
        ) : null}
      </div>
    </BentoCard>
  );
}

export function AttendanceTiles({ initialSnapshot, branchId, live }: LiveProps) {
  const { summary } = useLiveAttendance(initialSnapshot, branchId, live).data;

  return (
    <div className="grid grid-cols-2 gap-gutter">
      <MetricCard label="Expected" value={formatNumber(summary.expectedEmployees)} icon="group" />
      <MetricCard label="On Site" value={formatNumber(summary.currentlyIn)} icon="how_to_reg" tone="tertiary" />
      <MetricCard label="Clocked Out" value={formatNumber(summary.clockedOut)} icon="logout" />
      <MetricCard label={live ? "Not Yet In" : "Did Not Report"} value={formatNumber(summary.notYetIn)} icon="pending_actions" tone="amber" />
    </div>
  );
}

/** The filled card closing the column: are the terminals reporting? */
export function TerminalsBanner({ initialSnapshot, branchId, live }: LiveProps) {
  const { summary } = useLiveAttendance(initialSnapshot, branchId, live).data;

  return (
    <div className="sidebar-gradient relative overflow-hidden rounded-card p-4 text-on-primary sm:p-card-padding">
      <Icon name="fingerprint" className="pointer-events-none absolute -bottom-6 -right-4 text-[120px] opacity-15" />
      <p className="relative text-[10px] font-semibold uppercase tracking-wider opacity-80">Terminals</p>
      <p className="relative mt-1 text-xl font-bold">
        {formatNumber(summary.devicesOnline)} of {formatNumber(summary.devicesTotal)} reporting
      </p>
      <Link
        href="/admin/devices"
        className="relative mt-4 inline-flex min-h-10 items-center gap-1 rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
      >
        Open Devices
        <Icon name="arrow_forward" className="text-[18px]" />
      </Link>
    </div>
  );
}

/** The most recent scan anywhere, or the day being looked back at. */
export function LatestScanCard({ initialSnapshot, live }: Omit<LiveProps, "branchId">) {
  const { activity, summary } = useLiveAttendance(initialSnapshot, undefined, live).data;
  const latest = activity[0];

  return (
    <BentoCard title={live ? "Latest scan" : "Past day"} action={<span className="text-xs text-on-surface-variant">{formatDate(summary.date)}</span>}>
      {!live ? (
        <p className="text-sm text-on-surface-variant">These are the final figures for this day. Open a branch to see who attended.</p>
      ) : !latest ? (
        <p className="text-sm text-on-surface-variant">No clock events yet today. A scan appears here within about 15 seconds.</p>
      ) : (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary">
              {initials(latest.employeeName)}
            </span>
            <div className="min-w-0">
              <p className="break-words font-semibold text-on-surface">{latest.employeeName ?? "Unknown employee"}</p>
              <p className="break-words text-xs text-on-surface-variant">{latest.branchName ?? "Unassigned branch"}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm font-semibold tabular-nums text-on-surface">{formatTime(latest.occurredAt)}</span>
            <StatusBadge status={latest.type} />
          </div>
        </div>
      )}
    </BentoCard>
  );
}

function branchHref(branch: AttendanceBranchSummary, date: string | undefined): string {
  const base = `/admin/attendance/branches/${branch.branchId}`;
  return date ? `${base}?date=${date}` : base;
}

/** Every branch, ranked by nothing but its code. Opening one shows its own employees. */
export function BranchStandingsCard({ initialSnapshot, live, date }: Omit<LiveProps, "branchId"> & { date?: string }) {
  const { summary } = useLiveAttendance(initialSnapshot, undefined, live).data;
  const branches = summary.branches;
  const header = "whitespace-nowrap pb-3 pl-4 text-right font-table-header text-table-header uppercase text-outline";

  return (
    <BentoCard title="Branches" subtitle="Open a branch to see its employees">
      {branches.length === 0 ? (
        <EmptyState symbol="location_off" title="No branches yet" description="Branches appear here once they have been created." />
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {branches.map((branch) => (
              <li key={branch.branchId}>
                <Link href={branchHref(branch, date)} className="block min-w-0 rounded-lg border border-outline-variant/40 p-3 transition-colors hover:bg-surface-container-low">
                  <span className="flex min-w-0 items-start justify-between gap-3">
                    <span className="min-w-0 break-words font-semibold text-on-surface">{branch.branchName}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{formatPercent(branch.attendanceRatePercent)}</span>
                  </span>
                  <span className="mt-2 grid grid-cols-3 gap-2 text-xs text-on-surface-variant">
                    <span>Reported<span className="block font-semibold tabular-nums text-on-surface">{formatNumber(branch.reported)} / {formatNumber(branch.expected)}</span></span>
                    <span>On site<span className="block font-semibold tabular-nums text-on-surface">{formatNumber(branch.currentlyIn)}</span></span>
                    <span>{live ? "Not yet in" : "Absent"}<span className="block font-semibold tabular-nums text-on-surface">{formatNumber(branch.notYetIn)}</span></span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden w-full overflow-x-auto md:block">
            <table className="data-table w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Branch</th>
                  <th className={header}>Expected</th>
                  <th className={header}>Reported</th>
                  <th className={header}>On Site</th>
                  <th className={header}>{live ? "Not In" : "Absent"}</th>
                  <th className={`${header} pr-2`}>Rate</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {branches.map((branch) => (
                  <tr key={branch.branchId} className="border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface">
                    <td className="py-3 pl-2">
                      <Link href={branchHref(branch, date)} className="flex min-w-0 items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                          <Icon name="location_city" className="text-[18px]" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-on-surface">{branch.branchName}</span>
                          <span className="block font-mono text-[10px] text-outline">{branch.branchCode ?? "—"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pl-4 text-right tabular-nums">{formatNumber(branch.expected)}</td>
                    <td className="py-3 pl-4 text-right tabular-nums">{formatNumber(branch.reported)}</td>
                    <td className="py-3 pl-4 text-right tabular-nums">{formatNumber(branch.currentlyIn)}</td>
                    <td className="py-3 pl-4 text-right tabular-nums">{formatNumber(branch.notYetIn)}</td>
                    <td className="py-3 pl-4 pr-2 text-right font-semibold tabular-nums text-primary">{formatPercent(branch.attendanceRatePercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </BentoCard>
  );
}
