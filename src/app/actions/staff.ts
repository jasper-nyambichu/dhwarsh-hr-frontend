"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission, requireRole } from "@/app/lib/dal";
import { flashToast } from "@/app/lib/flash";
import { deleteEmployee, moveEmployeeBranch, terminateEmployee } from "@/lib/api/employee";
import {
  assignEmployeeDepartment,
  createEmployeeDirect,
  submitEmployeeRequest,
} from "@/lib/api/staff";
import type { ActionState } from "@/types";
import type { EmployeeEntryPayload } from "@/types/staff";

function text(formData: FormData, name: string): string | undefined {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? undefined : value;
}

type Parsed = { ok: true; payload: EmployeeEntryPayload } | { ok: false; state: ActionState };

function readEmployee(formData: FormData): Parsed {
  const fullName = text(formData, "fullName");
  const branchId = Number(formData.get("branchId"));
  const email = text(formData, "email");
  const mpesa = text(formData, "mpesaNumber");
  const salary = text(formData, "basicSalary");

  const fieldErrors: Record<string, string[]> = {};
  if (!fullName) fieldErrors.fullName = ["Required"];
  if (!Number.isInteger(branchId) || branchId <= 0) fieldErrors.branchId = ["Choose a branch"];
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = ["Not a valid email"];
  if (mpesa && !/^(\+?254|0)[17]\d{8}$/.test(mpesa.replace(/\s/g, ""))) fieldErrors.mpesaNumber = ["Use a Kenyan number, e.g. 0712 345 678"];

  for (const field of ["shifNumber", "nssfNumber", "kraPin"]) {
    if ((text(formData, field)?.length ?? 0) > 20) fieldErrors[field] = ["Use 20 characters or fewer"];
  }
  if (salary && !(Number(salary) >= 0)) fieldErrors.basicSalary = ["Enter zero or more"];

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { status: "error", message: "Check the fields below.", fieldErrors } };
  }

  const department = text(formData, "departmentId");
  const agent = text(formData, "agentId");

  return {
    ok: true,
    payload: {
      fullName: fullName!,
      nationalId: text(formData, "nationalId"),
      dateOfBirth: text(formData, "dateOfBirth"),
      gender: text(formData, "gender"),
      phone: text(formData, "phone"),
      email,
      branchId,
      departmentId: department ? Number(department) : undefined,
      agentId: agent ? Number(agent) : undefined,
      shifNumber: text(formData, "shifNumber"),
      nssfNumber: text(formData, "nssfNumber"),
      kraPin: text(formData, "kraPin"),
      basicSalary: salary ? Number(salary) : undefined,
      dateHired: text(formData, "dateHired"),
      // Pay goes out by M-Pesa for now, so the "bank" details are the M-Pesa number.
      bankName: mpesa ? "M-PESA" : undefined,
      bankAccountNumber: mpesa?.replace(/\s/g, ""),
      emergencyContactName: text(formData, "emergencyContactName"),
      emergencyContactPhone: text(formData, "emergencyContactPhone"),
    },
  };
}

/** Admin: add an employee straight away — no approval step. */
export async function addEmployeeAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("employee:write");

  const parsed = readEmployee(formData);
  if (!parsed.ok) return parsed.state;

  let employeeId: number;
  try {
    employeeId = (await createEmployeeDirect(parsed.payload)).id;
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/employees", "layout");
  await flashToast("success", "Employee added.");
  redirect(`/admin/employees/${employeeId}`);
}

/**
 * Branch Manager / Agent: propose an employee. Nothing exists until an Admin approves.
 *
 * Lands on "My requests" with `?sent=1`, which shows a clear "request sent" confirmation above the list.
 */
export async function requestEmployeeAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requirePermission("employee:request");

  const parsed = readEmployee(formData);
  if (!parsed.ok) return parsed.state;

  try {
    await submitEmployeeRequest(parsed.payload);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/branch", "layout");
  revalidatePath("/agent", "layout");
  await flashToast("success", "Request sent for approval.");
  redirect(session.role === "AGENT" ? "/agent/requests?sent=1" : "/branch/approvals?sent=1");
}

/** Admin or Branch Manager: put an employee in one of the company-wide departments. */
export async function assignDepartmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER"]);

  const id = Number(formData.get("employeeId"));
  const departmentId = Number(formData.get("departmentId"));

  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown employee." };
  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    return { status: "error", message: "Choose a department.", fieldErrors: { departmentId: ["Required"] } };
  }

  try {
    await assignEmployeeDepartment(id, departmentId);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/employees", "layout");
  revalidatePath("/branch/employees", "layout");
  return { status: "success", data: undefined };
}

/** Admin: delete an employee. Their code goes and the others close up; money records are kept. */
export async function deleteStaffAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("employee:write");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown employee." };

  try {
    await deleteEmployee(id);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/agent", "layout");
  revalidatePath("/branch", "layout");
  await flashToast("success", "Employee deleted.");
  redirect("/admin/employees");
}

/** Admin: move an employee to another branch. Both branches' portals change, not just the Admin's. */
export async function moveStaffBranchAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("employee:write");

  const id = Number(formData.get("employeeId"));
  const branchId = Number(formData.get("branchId"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown employee." };
  if (!Number.isInteger(branchId) || branchId <= 0) return { status: "error", message: "Choose a branch." };

  try {
    await moveEmployeeBranch(id, branchId);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/branch", "layout");
  revalidatePath("/agent", "layout");
  revalidatePath("/backoffice", "layout");
  return { status: "success", data: undefined };
}

/** Admin: end an employee's employment. */
export async function terminateStaffAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("employee:write");

  const id = Number(formData.get("employeeId"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown employee." };

  try {
    await terminateEmployee(id);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/employees", "layout");
  return { status: "success", data: undefined };
}