"use server";

import { refresh as refreshPage } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { grantOffDays, removeOffDay, updateOffDay } from "@/lib/api/off-day";
import type { ActionState } from "@/types";

// Re-renders the page the person is on. Nothing here is cached, so there is nothing else to clear.
function refresh(): void {
  refreshPage();
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Gives an employee their days off: one or two separate dates (at most two a month). The agent, the Branch
 * Manager or the Admin; the backend checks the employee is theirs to manage and the monthly limit.
 */
export async function grantOffDayAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("offday:grant");

  const employeeId = Number(formData.get("employeeId"));
  const date1 = String(formData.get("date1") ?? "");
  const date2 = formData.has("date2") ? String(formData.get("date2") ?? "") : null;
  const reason = String(formData.get("reason") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};
  if (!Number.isInteger(employeeId) || employeeId <= 0) fieldErrors.employeeId = ["Choose an employee"];
  if (!DATE.test(date1)) fieldErrors.date1 = ["Required"];
  if (date2 !== null) {
    if (!DATE.test(date2)) fieldErrors.date2 = ["Required"];
    else if (date2 === date1) fieldErrors.date2 = ["Choose a different day from the first"];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the fields below.", fieldErrors };
  }

  try {
    await grantOffDays({ employeeId, dates: date2 ? [date1, date2] : [date1], reason: reason || undefined });
  } catch (error) {
    return toActionError(error);
  }

  refresh();
  return { status: "success", data: undefined };
}

/** Moves one off day to another date. Refused by the backend for a day that has passed or a full month. */
export async function updateOffDayAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("offday:grant");

  const id = Number(formData.get("id"));
  const date = String(formData.get("date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown off day." };
  if (!DATE.test(date)) return { status: "error", message: "Check the fields below.", fieldErrors: { date: ["Required"] } };

  try {
    await updateOffDay(id, { date, reason: reason || undefined });
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
  await requirePermission("offday:grant");

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
