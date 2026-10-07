"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { shiftAssignmentSchema, shiftSchema } from "@/app/lib/definitions";
import {
  assignShift,
  createShift,
  updateShift,
} from "@/lib/api/shift";
import type {
  ActionState,
  ShiftAssignmentResponse,
  ShiftResponse,
} from "@/types";

/**
 * HR's shift writes — `controller/shift/ShiftController`.
 *
 * HR holds this entire controller, so there is no permission caveat here: the
 * same role that reads the roster can create, rename, retime and assign.
 */

function readShiftForm(formData: FormData) {
  return {
    name: formData.get("name"),
    type: formData.get("type") ?? "",
    startTime: formData.get("startTime") ?? "",
    endTime: formData.get("endTime") ?? "",
  };
}

/** Creates a shift. Type must be a `ShiftType` — see `SHIFT_TYPES` in @/types. */
export async function createShiftAction(
  _prev: ActionState<ShiftResponse>,
  formData: FormData,
): Promise<ActionState<ShiftResponse>> {
  await requirePermission("shift:write");

  const parsed = shiftSchema.safeParse(readShiftForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const shift = await createShift(parsed.data);

    revalidatePath("/hr/shifts");
    revalidatePath("/hr/shifts/roster");

    return { status: "success", data: shift };
  } catch (error) {
    return toActionError(error);
  }
}

/** Renames or retimes a shift. */
export async function updateShiftAction(
  _prev: ActionState<ShiftResponse>,
  formData: FormData,
): Promise<ActionState<ShiftResponse>> {
  await requirePermission("shift:write");

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { status: "error", message: "That shift id is not valid." };
  }

  const parsed = shiftSchema.safeParse(readShiftForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const shift = await updateShift(id, parsed.data);

    revalidatePath("/hr/shifts");
    revalidatePath("/hr/shifts/roster");

    return { status: "success", data: shift };
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Assigns a shift to an employee, a department or a branch.
 *
 * At least one target is required for the assignment to mean anything — the
 * backend accepts all three null and would store an assignment to nobody, so
 * that case is refused here rather than written.
 */
export async function assignShiftAction(
  _prev: ActionState<ShiftAssignmentResponse>,
  formData: FormData,
): Promise<ActionState<ShiftAssignmentResponse>> {
  await requirePermission("shift:assign");

  const parsed = shiftAssignmentSchema.safeParse({
    shiftId: formData.get("shiftId"),
    employeeId: formData.get("employeeId") ?? "",
    departmentId: formData.get("departmentId") ?? "",
    branchId: formData.get("branchId") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { shiftId, employeeId, departmentId, branchId } = parsed.data;

  if (!employeeId && !departmentId && !branchId) {
    return {
      status: "error",
      message: "Choose who the shift is for — an employee, a department or a branch.",
      fieldErrors: { employeeId: ["Pick a target for this assignment."] },
    };
  }

  try {
    const assignment = await assignShift({
      shiftId,
      employeeId,
      departmentId,
      branchId,
    });

    revalidatePath("/hr/shifts/roster");

    return { status: "success", data: assignment };
  } catch (error) {
    return toActionError(error);
  }
}
