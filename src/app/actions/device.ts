"use server";

import { refresh } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { deactivateDevice, registerDevice } from "@/lib/api/biometric";
import type { ActionState } from "@/types";

/** Returned once, so the Admin can enter the token on the branch's PC. It cannot be read back later. */
export type RegisteredDevice = { deviceSerial: string; token: string };

/** Admin: registers a terminal for a branch. The backend refuses a serial already in use. */
export async function registerDeviceAction(
  _previous: ActionState<RegisteredDevice>,
  formData: FormData,
): Promise<ActionState<RegisteredDevice>> {
  await requirePermission("biometric:device:manage");

  const branchId = Number(formData.get("branchId"));
  const deviceSerial = String(formData.get("deviceSerial") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};
  if (!Number.isInteger(branchId) || branchId <= 0) fieldErrors.branchId = ["Choose a branch."];
  if (!deviceSerial) fieldErrors.deviceSerial = ["Enter the device serial."];
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the fields below.", fieldErrors };
  }

  try {
    const device = await registerDevice(branchId, deviceSerial);
    refresh();
    return { status: "success", data: { deviceSerial: device.deviceSerial, token: device.plaintextToken } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Admin: takes a terminal out of service, for example before deleting its branch. */
export async function deactivateDeviceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("biometric:device:manage");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown terminal." };

  try {
    await deactivateDevice(id);
  } catch (error) {
    return toActionError(error);
  }

  refresh();
  return { status: "success", data: undefined };
}
