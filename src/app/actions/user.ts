"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { credentialsSchema } from "@/app/lib/definitions";
import { assignUserBranch, changeCredentials, createAgentLogin, createBranchLogin, deleteUser, setRunPayments } from "@/lib/api/user";
import type { ActionState } from "@/types";

/** Returned so the Admin can share them. `password` is empty when it was left unchanged. */
export type SavedCredentials = { username: string; password?: string };

/** Admin: set a new login for a branch or an agent, or change an existing one. */
export async function saveCredentialsAction(
  _previous: ActionState<SavedCredentials>,
  formData: FormData,
): Promise<ActionState<SavedCredentials>> {
  await requirePermission("user:manage");

  const userId = Number(formData.get("userId"));
  const branchId = Number(formData.get("branchId"));
  const agentId = Number(formData.get("agentId"));
  const role = formData.get("role");

  // Named per card, so the browser does not fill several cards with the same saved login.
  const usernameField = [...formData.keys()].find((key) => key.startsWith("username-"));
  const parsed = credentialsSchema.safeParse({
    username: usernameField ? formData.get(usernameField) : "",
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const credentials = parsed.data;
  if (!userId && !credentials.password) {
    return { status: "error", message: "Check the fields below.", fieldErrors: { password: ["Password is required."] } };
  }

  try {
    if (userId) {
      await changeCredentials(userId, credentials);
    } else if (agentId) {
      await createAgentLogin(agentId, credentials);
    } else if (branchId && (role === "BRANCH_MANAGER" || role === "BACK_OFFICE")) {
      await createBranchLogin(branchId, role, credentials);
    } else {
      return { status: "error", message: "Unknown account." };
    }
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/users", "layout");
  revalidatePath("/admin/branches", "layout");
  return { status: "success", data: credentials };
}

/** Admin: lets a Branch Manager run the agent payment calculation, or takes it back. */
export async function setRunPaymentsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("user:manage");

  const userId = Number(formData.get("userId"));
  if (!Number.isInteger(userId) || userId <= 0) return { status: "error", message: "Unknown account." };

  try {
    await setRunPayments(userId, formData.get("allowed") === "true");
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/pay-settings");
  return { status: "success", data: undefined };
}

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

/** Admin: which branch a Back Office officer works at. The backend refuses any other role, or a branch that already has one. */
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
