"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission, requireRole } from "@/app/lib/dal";
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
  type DepartmentInput,
} from "@/lib/api/department";
import type { ActionState } from "@/types";

type Parsed = { ok: true; input: DepartmentInput } | { ok: false; state: ActionState };

function readDepartment(formData: FormData): Parsed {
  const name = String(formData.get("name") ?? "").trim();
  const branchId = Number(formData.get("branchId"));
  const head = String(formData.get("headOfDepartmentId") ?? "").trim();
  const fieldErrors: Record<string, string[]> = {};

  if (!name) fieldErrors.name = ["Required"];
  if (!Number.isInteger(branchId) || branchId <= 0) fieldErrors.branchId = ["Choose a branch"];

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { status: "error", message: "Check the fields below.", fieldErrors } };
  }

  return {
    ok: true,
    input: { name, branchId, headOfDepartmentId: head ? Number(head) : undefined },
  };
}

export async function createDepartmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("department:write");

  const parsed = readDepartment(formData);
  if (!parsed.ok) return parsed.state;

  try {
    await createDepartment(parsed.input);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function updateDepartmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("department:write");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown department." };

  const parsed = readDepartment(formData);
  if (!parsed.ok) return parsed.state;

  try {
    await updateDepartment(id, parsed.input);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/departments");
  revalidatePath(`/admin/departments/${id}`);
  return { status: "success", data: undefined };
}

/** Admin / Super Admin only. The backend refuses while employees are still assigned. */
export async function deleteDepartmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown department." };

  try {
    await deleteDepartment(id);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/departments");
  return { status: "success", data: undefined };
}