import "server-only";

import { api } from "@/app/lib/api-client";
import type {
  ShiftAssignmentResponse,
  ShiftResponse,
} from "@/types";

/**
 * `controller/shift/ShiftController` — base `/shifts`.
 *
 * HR has the full surface here, which makes shifts the one HR module with no
 * permission caveats: create, update, list, assign, and read assignments by
 * employee or branch.
 *
 * There is no `GET /shifts/{id}` and no delete — a shift is never removed, only
 * edited, because assignments reference it.
 *
 * `ShiftRequest` is the same record for create and update.
 */

export type ShiftInput = {
  name: string;
  /** `entity/shift/ShiftType` — MORNING, EVENING, NIGHT, ROTATING, FLEXIBLE. */
  type: string;
  /** `LocalTime`, serialised "HH:mm" or "HH:mm:ss". Omit for none. */
  startTime?: string;
  endTime?: string;
};

/**
 * A shift assignment. The backend takes `ShiftAssignmentRequest`, whose three
 * target fields are all nullable — it assigns to whichever one is set.
 */
export type ShiftAssignmentInput = {
  shiftId: number;
  employeeId?: number;
  departmentId?: number;
  branchId?: number;
};

/** Every shift in the company. No per-branch scoping — shifts are global. */
export function getShifts(signal?: AbortSignal): Promise<ShiftResponse[]> {
  return api.get<ShiftResponse[]>("/shifts", { signal });
}

/** Creates a shift. SUPER_ADMIN, ADMIN, HR_MANAGER. */
export function createShift(payload: ShiftInput): Promise<ShiftResponse> {
  return api.post<ShiftResponse>("/shifts", payload);
}

/** Renames or retimes a shift. Same roles as create. */
export function updateShift(
  id: number,
  payload: ShiftInput,
): Promise<ShiftResponse> {
  return api.put<ShiftResponse>(`/shifts/${id}`, payload);
}

/** Assigns a shift to an employee, a department or a branch. */
export function assignShift(
  payload: ShiftAssignmentInput,
): Promise<ShiftAssignmentResponse> {
  return api.post<ShiftAssignmentResponse>("/shifts/assignments", payload);
}

/** One employee's shift assignments. */
export function getShiftAssignmentsForEmployee(
  employeeId: number,
  signal?: AbortSignal,
): Promise<ShiftAssignmentResponse[]> {
  return api.get<ShiftAssignmentResponse[]>(
    `/shifts/assignments/employee/${employeeId}`,
    { signal },
  );
}

/** Everything rostered in one branch — the roster screen's source. */
export function getShiftAssignmentsForBranch(
  branchId: number,
  signal?: AbortSignal,
): Promise<ShiftAssignmentResponse[]> {
  return api.get<ShiftAssignmentResponse[]>(
    `/shifts/assignments/branch/${branchId}`,
    { signal },
  );
}
