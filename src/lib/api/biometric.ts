import "server-only";

import { api } from "@/app/lib/api-client";
import type { BiometricDeviceResponse } from "@/types";

/**
 * `controller/attendance/BiometricDeviceController` — base `/attendance/devices`.
 *
 * Kept apart from `lib/api/attendance.ts` because it is a different backend
 * controller with a different audience: the dashboard module is the read-only
 * board, this one is terminal administration.
 *
 * The fleet-wide view lives on the dashboard controller
 * (`getAttendanceDevices` in `lib/api/attendance.ts`), which also computes the
 * `online` flag. This module cannot list all devices — only one branch at a
 * time. Use the dashboard call for a fleet table and this one for a single
 * branch's terminals.
 */

/** Terminals registered to one branch. */
export function getDevicesByBranch(
  branchId: number,
  signal?: AbortSignal,
): Promise<BiometricDeviceResponse[]> {
  return api.get<BiometricDeviceResponse[]>(
    `/attendance/devices/by-branch/${branchId}`,
    { signal },
  );
}

/**
 * Deactivates a terminal. SUPER_ADMIN and ADMIN.
 *
 */
/** Registers a terminal. The token comes back this once: only its scrambled form is stored. */
export function registerDevice(branchId: number, deviceSerial: string): Promise<{ id: number; deviceSerial: string; plaintextToken: string }> {
  return api.post(`/attendance/devices`, { branchId, deviceSerial });
}

/** How many of this employee's fingers are saved centrally, and so follow them to another branch. */
export function countEmployeeFingerprints(employeeId: number): Promise<number> {
  return api.get<number>(`/attendance/enrollment/employees/${employeeId}/fingerprints/count`);
}

export function deactivateDevice(deviceId: number): Promise<void> {
  return api.put<void>(`/attendance/devices/${deviceId}/deactivate`);
}
