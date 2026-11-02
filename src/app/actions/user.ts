"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { assignUserBranch, deleteUser } from "@/lib/api/user";
import type { ActionState } from "@/types";

/** Admin: delete an account. The backend refuses your own account and the last active Admin. */
export async function deleteUserAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("user:manage");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown account." };

  try {
    await deleteUser(id);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/users", "layout");
  revalidatePath("/admin/branches", "layout");
  return { status: "success", data: undefined };
}

/** Admin: which branch a Back Office officer works at. The backend refuses any other role. */
export async function assignUserBranchAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("user:manage");

  const userId = Number(formData.get("userId"));
  const branchId = Number(formData.get(`branchId-${userId}`));

  if (!Number.isInteger(userId) || userId <= 0) return { status: "error", message: "Unknown account." };
  if (!Number.isInteger(branchId) || branchId <= 0) return { status: "error", message: "Choose a branch." };

  try {
    await assignUserBranch(userId, branchId);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/users", "layout");
  return { status: "success", data: undefined };
}
