"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { credentialsSchema } from "@/app/lib/definitions";
import { flashToast } from "@/app/lib/flash";
import { assignUserBranch, changeCredentials, createAgentLogin, createBranchLogin, deleteUser, getSavedLogin, linkUserEmployee, type SavedLogin } from "@/lib/api/user";
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
    email: formData.get("email") ?? "",
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

  refresh();
  return { status: "success", data: credentials };
}

/** Admin: look up a login's saved username and password again, to share it. Each look is audited. */
export async function revealSavedLoginAction(userId: number): Promise<ActionState<SavedLogin>> {
  await requirePermission("user:manage");
  if (!Number.isInteger(userId) || userId <= 0) return { status: "error", message: "Unknown account." };

  try {
    return { status: "success", data: await getSavedLogin(userId) };
  } catch (error) {
    return toActionError(error);
  }
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

  refresh();
  return { status: "success", data: undefined };
}

/**
 * Admin: move a Branch Manager to another branch, then open that branch's page, where they now appear.
 * A branch has one Branch Manager, so choosing a taken branch swaps the two. The backend refuses the same branch.
 */
export async function moveBranchManagerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("user:manage");

  const userId = Number(formData.get("userId"));
  const branchId = Number(formData.get(`branchId-${userId}`));

  if (!Number.isInteger(userId) || userId <= 0) return { status: "error", message: "Unknown account." };
  if (!Number.isInteger(branchId) || branchId <= 0) return { status: "error", message: "Choose a branch." };

  const swap = formData.get("swap") === "1";

  try {
    await assignUserBranch(userId, branchId, swap);
  } catch (error) {
    return toActionError(error);
  }

  refresh();
  const branchName = formData.get("branchName") || "the new branch";
  await flashToast("success", swap ? `Branch Managers swapped. This one now runs ${branchName}.` : `Branch Manager moved to ${branchName}.`);
  redirect(`/admin/users/branches/${branchId}`);
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

  refresh();
  return { status: "success", data: undefined };
}

/**
 * Admin: link a Branch Manager or Back Office login to the employee record of the person behind it, or unlink it.
 * The branch PC then shows them as such in its lists and lets them sign in there with their fingerprint.
 */
export async function linkUserEmployeeAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("user:manage");

  const userId = Number(formData.get("userId"));
  const raw = String(formData.get(`employeeId-${userId}`) ?? "");
  const employeeId = raw === "" ? null : Number(raw);

  if (!Number.isInteger(userId) || userId <= 0) return { status: "error", message: "Unknown account." };
  if (employeeId !== null && (!Number.isInteger(employeeId) || employeeId <= 0)) {
    return { status: "error", message: "Choose an employee." };
  }

  try {
    await linkUserEmployee(userId, employeeId);
  } catch (error) {
    return toActionError(error);
  }

  refresh();
  return { status: "success", data: undefined };
}
