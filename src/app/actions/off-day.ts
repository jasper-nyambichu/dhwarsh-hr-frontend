"use server";

import { refresh as refreshPage } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { grantOffDay, removeOffDay } from "@/lib/api/off-day";
import type { ActionState } from "@/types";

// Re-renders the page the person is on. Nothing here is cached, so there is nothing else to clear.
function refresh(): void {
  refreshPage();
}

/** Agent: gives one of their own employees days off. A single day sends no end date. The backend checks the employee is theirs. */
export async function grantOffDayAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("offday:manage");

  const employeeId = Number(formData.get("employeeId"));
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "") || (formData.has("endDate") ? "" : startDate);
  const reason = String(formData.get("reason") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};
  if (!Number.isInteger(employeeId) || employeeId <= 0) fieldErrors.employeeId = ["Choose an employee"];
  if (!startDate) fieldErrors.startDate = ["Required"];
  if (!endDate) fieldErrors.endDate = ["Required"];
  else if (startDate && endDate < startDate) fieldErrors.endDate = ["Cannot be before the first day"];

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the fields below.", fieldErrors };
  }

  try {
    await grantOffDay({ employeeId, startDate, endDate, reason: reason || undefined });
  } catch (error) {
    return toActionError(error);
  }

  refresh();
  return { status: "success", data: undefined };
}

export async function removeOffDayAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("offday:manage");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown off day." };

  try {
    await removeOffDay(id);
  } catch (error) {
    return toActionError(error);
  }

  refresh();
  return { status: "success", data: undefined };
}
