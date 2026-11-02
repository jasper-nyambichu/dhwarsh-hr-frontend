"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requireRole } from "@/app/lib/dal";
import { lockDaysWorked, unlockDaysWorked } from "@/lib/api/days-worked";
import type { ActionState } from "@/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Admin: lock a period's days so agent payments can use them. */
export async function lockDaysWorkedAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const branchId = Number(formData.get("branchId"));
  const periodStart = String(formData.get("periodStart") ?? "");
  const periodEnd = String(formData.get("periodEnd") ?? "");
  if (!Number.isInteger(branchId) || branchId <= 0 || !periodStart || !periodEnd) {
    return { status: "error", message: "Choose a branch and a period." };
  }

  try {
    await lockDaysWorked(branchId, periodStart, periodEnd);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/days-worked");
  return { status: "success", data: undefined };
}

/** Admin: reopen a locked period so the Back Office can correct it and lock it again. */
export async function unlockDaysWorkedAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const branchId = Number(formData.get("branchId"));
  const periodStart = String(formData.get("periodStart") ?? "");
  const periodEnd = String(formData.get("periodEnd") ?? "");

  if (!Number.isInteger(branchId) || branchId <= 0) return { status: "error", message: "Unknown branch." };
  if (!ISO_DATE.test(periodStart) || !ISO_DATE.test(periodEnd)) {
    return { status: "error", message: "Unknown pay period." };
  }

  try {
    await unlockDaysWorked(branchId, periodStart, periodEnd);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin", "layout");
  return { status: "success", data: undefined };
}