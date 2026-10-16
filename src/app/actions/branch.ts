"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission, requireRole } from "@/app/lib/dal";
import {
  activateBranch,
  createBranch,
  deactivateBranch,
  updateBranch,
  type BranchInput,
} from "@/lib/api/branch";
import type { ActionState } from "@/types";

function text(formData: FormData, name: string): string | undefined {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? undefined : value;
}

type Parsed = { ok: true; input: BranchInput } | { ok: false; state: ActionState };

function readBranch(formData: FormData): Parsed {
  const name = text(formData, "name");
  const code = text(formData, "code");
  const email = text(formData, "email");
  const fieldErrors: Record<string, string[]> = {};

  if (!name) fieldErrors.name = ["Required"];
  if (!code) fieldErrors.code = ["Required"];
  else if (!/^[A-Za-z0-9-]{2,20}$/.test(code)) fieldErrors.code = ["2–20 letters, numbers or dashes"];
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = ["Not a valid email"];

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { status: "error", message: "Check the fields below.", fieldErrors } };
  }

  const manager = text(formData, "managerId");

  return {
    ok: true,
    input: {
      name: name!,
      code: code!,
      address: text(formData, "address"),
      phone: text(formData, "phone"),
      email,
      managerId: manager ? Number(manager) : undefined,
    },
  };
}

/** Admin: create a branch, then return to the list. */
export async function createBranchAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("branch:write");

  const parsed = readBranch(formData);
  if (!parsed.ok) return parsed.state;

  try {
    await createBranch(parsed.input);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/branches");
  redirect("/admin/branches");
}

/** Admin: update a branch in place. */
export async function updateBranchAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("branch:write");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown branch." };

  const parsed = readBranch(formData);
  if (!parsed.ok) return parsed.state;

  try {
    await updateBranch(id, parsed.input);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/branches");
  revalidatePath(`/admin/branches/${id}`);
  return { status: "success", data: undefined };
}

/** Super Admin only: activate or deactivate a branch. */
export async function setBranchStatusAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["SUPER_ADMIN"]);

  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(id) || id <= 0 || (status !== "ACTIVE" && status !== "INACTIVE")) {
    return { status: "error", message: "Unknown branch or status." };
  }

  try {
    if (status === "ACTIVE") await activateBranch(id);
    else await deactivateBranch(id);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/branches");
  revalidatePath(`/admin/branches/${id}`);
  return { status: "success", data: undefined };
}