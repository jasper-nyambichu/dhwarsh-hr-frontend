import "server-only";

import { api } from "@/app/lib/api-client";
import type {
  AttendanceActivityItem,
  AttendanceDashboardSummary,
  AttendanceDeviceItem,
  AttendanceRecordItem,
  AttendanceResponse,
  AttendanceSyncFailure,
  Paginated,
} from "@/types";

/**
 * `controller/attendance/AttendanceDashboardController`.
 *
 * Every function here is a read. They live in one module rather than inline at
 * the call sites because two callers need the same endpoints: the page itself
 * and the polling route at `app/api/attendance/live`. Duplicating the paths
 * would mean a rename on the backend breaks one of them silently.
 *
 * There are no write endpoints in this module on purpose — the dashboard is
 * read-only. Manual attendance corrections live on the HR surfaces.
 */

export type AttendanceSummaryParams = {
  /** Business day to summarise. Defaults to today (company timezone). */
  date?: string;
  branchId?: number;
};

export type AttendanceActivityParams = {
  branchId?: number;
  /** ISO date-time. Omit for "since the start of today". */
  since?: string;
  /** Backend clamps to 1..200. */
  limit?: number;
};

export type AttendanceRecordsParams = {
  branchId?: number;
  /** Inclusive, `yyyy-MM-dd`. Defaults to today. */
  start?: string;
  end?: string;
  /** Only employees still on shift. */
  openOnly?: boolean;
  page?: number;
  size?: number;
};

/** Headcount, clock-in counts, attendance rate and per-branch roll-up. */
export function getAttendanceSummary(
  params: AttendanceSummaryParams = {},
  signal?: AbortSignal,
): Promise<AttendanceDashboardSummary> {
  return api.get<AttendanceDashboardSummary>("/attendance/dashboard/summary", {
    query: { date: params.date, branchId: params.branchId },
    signal,
  });
}

/** The live feed, newest first. Each record contributes up to two entries. */
export function getAttendanceActivity(
  params: AttendanceActivityParams = {},
  signal?: AbortSignal,
): Promise<AttendanceActivityItem[]> {
  return api.get<AttendanceActivityItem[]>("/attendance/dashboard/activity", {
    query: {
      branchId: params.branchId,
      since: params.since,
      limit: params.limit ?? 50,
    },
    signal,
  });
}

/**
 * The records table. The backend returns its own `PageResponse<T>`, whose
 * fields match the frontend's `Paginated<T>` one for one — so `getPage` is
 * right here and `get` would be wrong.
 */
export function getAttendanceRecords(
  params: AttendanceRecordsParams = {},
): Promise<Paginated<AttendanceRecordItem>> {
  return api.getPage<AttendanceRecordItem>("/attendance/dashboard/records", {
    query: {
      branchId: params.branchId,
      start: params.start,
      end: params.end,
      openOnly: params.openOnly,
      page: params.page ?? 0,
      size: params.size ?? 25,
    },
  });
}

/**
 * The terminal fleet. `online` is computed server-side against a 5-minute
 * freshness window, so it is a real liveness signal and not a stored flag.
 */
export function getAttendanceDevices(
  params: { branchId?: number } = {},
): Promise<AttendanceDeviceItem[]> {
  return api.get<AttendanceDeviceItem[]>("/attendance/dashboard/devices", {
    query: { branchId: params.branchId },
  });
}

/**
 * Scans the backend refused, last 100. This is the only surface where an
 * administrator learns that a clock-in silently did not happen — a rejected
 * event leaves no row in `attendance`.
 */
export function getAttendanceSyncFailures(): Promise<AttendanceSyncFailure[]> {
  return api.get<AttendanceSyncFailure[]>(
    "/attendance/dashboard/sync-failures",
  );
}

/**
 * One employee's attendance over a date window.
 *
 * `start` and `end` are `@RequestParam` on the backend and are **required** —
 * omitting either is a 400, not a defaulted range. Both are inclusive
 * `yyyy-MM-dd`.
 */
export function getAttendanceForEmployee(
  employeeId: number,
  params: { start: string; end: string },
  signal?: AbortSignal,
): Promise<AttendanceResponse[]> {
  return api.get<AttendanceResponse[]>(`/attendance/employee/${employeeId}`, {
    query: { start: params.start, end: params.end },
    signal,
  });
}

/** One branch's attendance over a date window. `start` and `end` required. */
export function getAttendanceForBranch(
  branchId: number,
  params: { start: string; end: string },
  signal?: AbortSignal,
): Promise<AttendanceResponse[]> {
  return api.get<AttendanceResponse[]>(`/attendance/branch/${branchId}`, {
    query: { start: params.start, end: params.end },
    signal,
  });
}
