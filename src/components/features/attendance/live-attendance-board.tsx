"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";

import { BentoCard } from "@/components/shared/bento-card";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { queryKeys } from "@/lib/api/query-keys";
import {
  formatNumber,
  formatPercent,
  formatTime,
  initials,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AttendanceActivityItem,
  AttendanceLiveSnapshot,
  AttendanceSource,
} from "@/types";

/**
 * The live half of the admin attendance board: the KPI tiles and the clock-in /
 * clock-out ticker.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS IS A CLIENT COMPONENT, AND WHY IT POLLS
 *
 * The backend has no WebSocket or SSE channel — HrpayrollDesktop pushes a scan
 * to `POST /attendance/biometric/sync` every 15s and that is the whole
 * notification story. So "live" here means polling, at the same 15s cadence the
 * terminal syncs on, which puts a scan on screen within roughly two cycles.
 *
 * The alternative — `router.refresh()` on a timer — would re-render the entire
 * Server Component subtree, re-running the records query and the device query
 * on every tick. This polls the two projections that actually change.
 *
 * `initialSnapshot` is fetched by the Server Component and passed in as
 * `initialData`, so the first paint is already correct: no skeleton, no flash
 * of zeros, and the page is useful even before the first interval fires.
 * ─────────────────────────────────────────────────────────────────────────
 */

const POLL_INTERVAL_MS = 15_000;
/** The feed is a ticker. The records table below carries the full day. */
const FEED_LIMIT = 12;

/** Mirrors the icon map on the HR attendance screen. */
const SOURCE_ICON: Record<AttendanceSource, string> = {
  BIOMETRIC: "fingerprint",
  MANUAL: "badge",
  MOBILE: "smartphone",
  WEB: "language",
};

/**
 * Stable identity for a feed row. `attendanceId` alone is not enough: one
 * attendance record produces both a CLOCK_IN and a CLOCK_OUT entry, so the
 * record id repeats with a different meaning.
 */
function activityKey(item: AttendanceActivityItem): string {
  return `${item.attendanceId}:${item.type}:${item.occurredAt}`;
}

async function fetchSnapshot(
  branchId: number | undefined,
  signal: AbortSignal,
): Promise<AttendanceLiveSnapshot> {
  const url = new URL("/api/attendance/live", window.location.origin);
  if (branchId) url.searchParams.set("branchId", String(branchId));

  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    // The route answers with `{ message }` on 401/403 and on a backend
    // failure; anything else (a proxy page, an empty body) falls back.
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      body?.message?.trim() || "Unable to refresh attendance right now.",
    );
  }

  return (await response.json()) as AttendanceLiveSnapshot;
}

/** The polled snapshot. Off on a past date: those figures are final, and today's must not replace them. */
export function useLiveAttendance(
  initialSnapshot: AttendanceLiveSnapshot,
  branchId: number | undefined,
  live = true,
) {
  return useQuery({
    queryKey: live
      ? queryKeys.attendance.live(branchId)
      : [...queryKeys.attendance.live(branchId), initialSnapshot.summary.date],
    queryFn: ({ signal }) => fetchSnapshot(branchId, signal),
    initialData: initialSnapshot,
    // Age is measured from when the server assembled the snapshot, so the
    // query is already ~0s old on mount and the first interval tick is what
    // refreshes it. Both clocks are the same machine in dev.
    initialDataUpdatedAt: Date.parse(initialSnapshot.fetchedAt),
    // Overrides the client's 30s default. A 15s interval against 30s-stale data
    // gives an inconsistent cadence, and the subtitle promises 15s — a figure
    // the board must actually keep. The cost is one refetch on mount, which is
    // the "confirm this is live" fetch the screen wants anyway.
    staleTime: live ? 0 : Infinity,
    enabled: live,
    refetchInterval: live ? POLL_INTERVAL_MS : false,
    // `refetchIntervalInBackground` is left at its default (false): a hidden
    // tab stops polling, which matters when a dashboard is left open all day.
  });
}

/** The clock-in / clock-out ticker. */
export function LiveActivityCard({
  initialSnapshot,
  branchId,
  recordsHref,
}: {
  initialSnapshot: AttendanceLiveSnapshot;
  branchId?: number;
  /** Where "Full log" points. Left out when the page already shows the records. */
  recordsHref?: string;
}) {
  const { data, isError, error, isFetching, refetch } = useLiveAttendance(initialSnapshot, branchId);
  const { activity, fetchedAt } = data;

  // Which rows are newer than the page load. Derived from the initial snapshot
  // rather than from the wall clock, so the server and client render the same
  // markup and there is no hydration mismatch.
  const initialKeys = useMemo(
    () => new Set(initialSnapshot.activity.map(activityKey)),
    [initialSnapshot],
  );

  const feed = activity.slice(0, FEED_LIMIT);

  return (
    <BentoCard
      title={
        <span className="flex items-center gap-2">
          <span className="relative flex size-2" aria-hidden>
            <span
              className={cn(
                "absolute inline-flex size-full rounded-full bg-green-main",
                isFetching ? "animate-ping motion-reduce:animate-none" : "",
              )}
            />
            <span className="relative inline-flex size-2 rounded-full bg-green-main" />
          </span>
          Live Activity
        </span>
      }
      subtitle={`Updated ${formatTime(fetchedAt)} · refreshes every 15s · newest first`}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-live=""
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-60"
          >
            <Icon
              name="refresh"
              className={cn(
                "text-[18px]",
                isFetching && "animate-spin motion-reduce:animate-none",
              )}
            />
            Refresh
          </button>

          {recordsHref ? (
          <Link
            href={recordsHref}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-surface-container-low"
          >
            Full log
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
          ) : null}
        </div>
      }
    >
      {isError ? (
        <p
          role="status"
          className="mb-3 flex items-start gap-2 rounded-lg bg-amber-main/10 px-3 py-2 text-[11px] text-amber-main"
        >
          <Icon name="cloud_off" className="text-[16px]" />
          {error instanceof Error
            ? error.message
            : "Unable to refresh attendance right now."}{" "}
          Displaying the last values received at {formatTime(fetchedAt)}.
        </p>
      ) : null}

      {feed.length === 0 ? (
        // Suppressed while the refresh is failing: "no clock events today" is
        // a claim about the world, and a failed poll is not evidence for it.
        isError ? null : (
          <div className="rounded-card border border-dashed border-outline-variant px-4 py-12 text-center">
            <Icon
              name="fingerprint"
              className="text-[40px] text-outline-variant"
            />
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              No clock events yet today.
            </p>
            <p className="mt-1 text-[11px] text-outline">
              A scan appears here within about 15 seconds of the employee
              fingerprinting at the terminal.
            </p>
          </div>
        )
      ) : (
        <ul className="-mx-2 flex flex-col">
          {feed.map((item) => {
            const isNew = !initialKeys.has(activityKey(item));

            return (
              <li key={activityKey(item)}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2.5",
                    isNew && "bg-tertiary-container/10",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      item.type === "CLOCK_IN"
                        ? "bg-primary-container text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant",
                    )}
                  >
                    {initials(item.employeeName)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium text-on-surface">
                        {item.employeeName ?? "Unknown employee"}
                      </span>
                      {isNew ? (
                        <span className="shrink-0 rounded bg-tertiary-container/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-tertiary">
                          New
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-[10px] text-outline">
                      <span>{item.employeeNumber ?? "—"}</span>
                      <span aria-hidden>·</span>
                      <span className="truncate">
                        {item.branchName ?? "Unassigned branch"}
                      </span>
                    </span>
                  </span>

                  <span
                    className="hidden shrink-0 text-outline sm:block"
                    title={`Captured via ${item.source.toLowerCase()}`}
                  >
                    <Icon name={SOURCE_ICON[item.source]} className="text-[18px]" />
                    <span className="sr-only">
                      Captured via {item.source.toLowerCase()}
                    </span>
                  </span>

                  <span className="shrink-0 tabular-nums text-body-md text-on-surface">
                    {formatTime(item.occurredAt)}
                  </span>

                  <span className="shrink-0">
                    <StatusBadge status={item.type} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </BentoCard>
  );
}

export function LiveAttendanceBoard({
  initialSnapshot,
  branchId,
  recordsHref,
}: {
  initialSnapshot: AttendanceLiveSnapshot;
  /** Undefined means "all branches". Part of the query key, so it refetches. */
  branchId?: number;
  /** Where the feed's "View all" points, carrying the current filters. */
  recordsHref: string;
}) {
  const { summary } = useLiveAttendance(initialSnapshot, branchId).data;

  return (
    <div className="flex flex-col gap-gutter">
      {/* ─────────────────────────────── KPI row ────────────────────────── */}
      <div className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
        <StatCard
          label="Expected Today"
          value={formatNumber(summary.expectedEmployees)}
          icon="group"
          badgeIcon="badge"
          hint={`${formatPercent(summary.attendanceRatePercent)} reported`}
        />
        <StatCard
          label="On Site Now"
          value={formatNumber(summary.currentlyIn)}
          icon="how_to_reg"
          badgeIcon="fingerprint"
          hint="Clocked in, not yet out"
        />
        <StatCard
          label="Clocked Out"
          value={formatNumber(summary.clockedOut)}
          icon="logout"
          badgeIcon="check_circle"
        />
        <StatCard
          label="Not Yet In"
          value={formatNumber(summary.notYetIn)}
          // Not an error tone: on a normal morning most of the workforce is
          // "not yet in" at 07:00, and colouring that red would train the user
          // to ignore the one figure that should stand out.
          icon="pending_actions"
          badgeIcon="schedule"
          hint={
            summary.notYetIn > 0
              ? `${formatNumber(summary.devicesOnline)}/${formatNumber(summary.devicesTotal)} terminals online`
              : undefined
          }
        />
      </div>

      <SegmentStrip
        segments={[
          { label: "Reported", value: formatNumber(summary.reported) },
          { label: "Rate", value: formatPercent(summary.attendanceRatePercent) },
          {
            label: "Not reported",
            value: formatNumber(summary.notYetIn),
            tone: summary.notYetIn > 0 ? "warning" : "default",
          },
          {
            label: "Terminals online",
            value: `${formatNumber(summary.devicesOnline)}/${formatNumber(summary.devicesTotal)}`,
            tone:
              summary.devicesTotal > 0 &&
              summary.devicesOnline === summary.devicesTotal
                ? "success"
                : "warning",
          },
        ]}
      />

      <LiveActivityCard initialSnapshot={initialSnapshot} branchId={branchId} recordsHref={recordsHref} />
    </div>
  );
}
