"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { cancelDamage } from "@/lib/api/damage";
import type { ActionState } from "@/types";

/** Admin: stop a damage from being deducted, for example one on an employee with no agent to deduct it from. */
export async function cancelDamageAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("damage:cancel");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown damage." };

  try {
    await cancelDamage(id);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin", "layout");
  return { status: "success", data: undefined };
}
