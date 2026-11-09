"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission, requireRole } from "@/app/lib/dal";
import { flashToast } from "@/app/lib/flash";
import {
  activateBranch,
  createBranch,
  deactivateBranch,
  deleteBranch,
  getBranches,
  updateBranch,
  type BranchInput,
} from "@/lib/api/branch";
import type { BulkDeleteResult } from "@/components/shared/bulk-delete";
import type { ActionState } from "@/types";

function text(formData: FormData, name: string): string | undefined {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? undefined : value;
}

type Parsed = { ok: true; input: BranchInput } | { ok: false; state: ActionState };

function readBranch(formData: FormData): Parsed {
  const name = text(formData, "name");
  const email = text(formData, "email");
  const fieldErrors: Record<string, string[]> = {};

  if (!name) fieldErrors.name = ["Required"];
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = ["Not a valid email"];

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { status: "error", message: "Check the fields below.", fieldErrors } };
  }

  const manager = text(formData, "managerId");

  return {
    ok: true,
    input: {
      name: name!,
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

  refresh();
  await flashToast("success", "Branch created.");
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

  refresh();
  return { status: "success", data: undefined };
}

/** Admin: delete a branch. The backend refuses while it still has employees or active terminals. */
export async function deleteBranchAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("branch:write");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown branch." };

  try {
    await deleteBranch(id);
  } catch (error) {
    return toActionError(error);
  }

  refresh();
  return { status: "success", data: undefined };
}

/** Admin: activate or deactivate a branch. */
export async function setBranchStatusAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

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

  refresh();
  return { status: "success", data: undefined };
}

/** The ids ticked in a bulk-delete form: whole positive numbers, each once. */
function tickedIds(formData: FormData): number[] {
  return [...new Set(formData.getAll("ids").map(Number))].filter((id) => Number.isInteger(id) && id > 0);
}

function reasonOf(error: unknown): string {
  const result = toActionError(error);
  return result.status === "error" ? result.message : "Could not be deleted.";
}

/**
 * Admin: delete the ticked branches, one after another (codes close up after each). The backend refuses a
 * branch that still has employees or active terminals; those are reported by name and the rest still go.
 */
export async function deleteBranchesAction(
  _previous: ActionState<BulkDeleteResult>,
  formData: FormData,
): Promise<ActionState<BulkDeleteResult>> {
  await requirePermission("branch:write");

  const ids = tickedIds(formData);
  if (ids.length === 0) return { status: "error", message: "Tick the branches to delete." };

  const names = new Map((await getBranches().catch(() => [])).map((branch) => [branch.id, branch.name]));
  let deleted = 0;
  const refused: BulkDeleteResult["refused"] = [];
  for (const id of ids) {
    try {
      await deleteBranch(id);
      deleted++;
    } catch (error) {
      refused.push({ name: names.get(id) ?? `Branch #${id}`, reason: reasonOf(error) });
    }
  }

  refresh();
  return { status: "success", data: { deleted, refused } };
}
