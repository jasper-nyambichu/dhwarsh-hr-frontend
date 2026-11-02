"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { deactivateDevice } from "@/lib/api/biometric";
import type { ActionState } from "@/types";

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

  revalidatePath("/admin/devices");
  return { status: "success", data: undefined };
}
