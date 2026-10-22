"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { getMyBranch } from "@/lib/api/branch";
import { assignShift } from "@/lib/api/shift";
import type { ActionState } from "@/types";

/**
 * Branch Manager: put one of their employees — or their whole branch — on a shift. The branch is
 * the manager's own, never taken from the form, and the backend refuses anything outside it.
 */
export async function assignRosterShiftAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("shift:assign");

  const shiftId = Number(formData.get("shiftId"));
  const target = String(formData.get("target") ?? "");
  const employeeId = Number(formData.get("employeeId"));

  if (!Number.isInteger(shiftId) || shiftId <= 0) {
    return { status: "error", message: "Choose a shift.", fieldErrors: { shiftId: ["Required"] } };
  }
  if (target !== "branch" && target !== "employee") {
    return { status: "error", message: "Choose who the shift is for." };
  }
  if (target === "employee" && (!Number.isInteger(employeeId) || employeeId <= 0)) {
    return { status: "error", message: "Choose an employee.", fieldErrors: { employeeId: ["Required"] } };
  }

  try {
    if (target === "branch") {
      const branch = await getMyBranch();
      await assignShift({ shiftId, branchId: branch.id });
    } else {
      await assignShift({ shiftId, employeeId });
    }
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/branch/roster");
  return { status: "success", data: undefined };
}