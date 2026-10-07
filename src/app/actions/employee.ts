"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { employeeSchema } from "@/app/lib/definitions";
import {
  createEmployee,
  terminateEmployee,
  updateEmployee,
} from "@/lib/api/employee";
import type { ActionState, EmployeeResponse } from "@/types";

/**
 * HR's employee write path — `controller/employee/EmployeeController`.
 *
 * `POST /employees` and `PUT /employees/{id}` both accept the same record,
 * `EmployeeRequest`, so both actions parse with one zod schema. That schema
 * (`employeeSchema` in `app/lib/definitions.ts`) is the field-for-field mirror
 * of the DTO and is the single place the two ends are kept honest.
 *
 * Four fields are actually required by the backend: fullName, branchId,
 * employmentType, basicSalary. Everything else may be left blank, and blank
 * means "omit", not "send an empty string" — the schema's preprocessors turn
 * "" into undefined, because the DTO binds to Java enums and LocalDate and
 * would reject "".
 *
 * `employeeNumber` is deliberately absent: the service generates it as
 * `EMP-<branchCode>-<seq>`. `employmentStatus` is absent too — it is not a
 * field on the request at all.
 */

/** Pulls exactly the fields the schema knows about out of the FormData. */
function readEmployeeForm(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    nationalId: formData.get("nationalId") ?? "",
    dateOfBirth: formData.get("dateOfBirth") ?? "",
    gender: formData.get("gender") ?? "",
    maritalStatus: formData.get("maritalStatus") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    address: formData.get("address") ?? "",
    kraPin: formData.get("kraPin") ?? "",
    shifNumber: formData.get("shifNumber") ?? "",
    nssfNumber: formData.get("nssfNumber") ?? "",
    nitaNumber: formData.get("nitaNumber") ?? "",
    branchId: formData.get("branchId"),
    departmentId: formData.get("departmentId") ?? "",
    agentId: formData.get("agentId") ?? "",
    position: formData.get("position") ?? "",
    employmentType: formData.get("employmentType") ?? "",
    basicSalary: formData.get("basicSalary"),
    dateHired: formData.get("dateHired") ?? "",
    bankName: formData.get("bankName") ?? "",
    bankAccountNumber: formData.get("bankAccountNumber") ?? "",
    emergencyContactName: formData.get("emergencyContactName") ?? "",
    emergencyContactPhone: formData.get("emergencyContactPhone") ?? "",
  };
}

/**
 * Creates an employee and returns the persisted record.
 *
 * Returning the created row rather than redirecting is deliberate: the
 * `employeeNumber` in the response is minted by the service, so showing it is
 * the user's proof that the row reached the database rather than just the form
 * state.
 */
export async function createEmployeeAction(
  _prev: ActionState<EmployeeResponse>,
  formData: FormData,
): Promise<ActionState<EmployeeResponse>> {
  // Re-checked here because a Server Action is reachable as a direct POST
  // regardless of which component imported it.
  await requirePermission("employee:write");

  const parsed = employeeSchema.safeParse(readEmployeeForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const employee = await createEmployee(parsed.data);

    // The directory is assembled per branch, so every branch's slice is stale.
    revalidatePath("/hr/employees");
    revalidatePath(`/hr/employees/${employee.id}`);

    return { status: "success", data: employee };
  } catch (error) {
    return toActionError(error);
  }
}

/** Updates an employee in place. Same payload shape as create. */
export async function updateEmployeeAction(
  _prev: ActionState<EmployeeResponse>,
  formData: FormData,
): Promise<ActionState<EmployeeResponse>> {
  await requirePermission("employee:write");

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { status: "error", message: "That employee id is not valid." };
  }

  const parsed = employeeSchema.safeParse(readEmployeeForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const employee = await updateEmployee(id, parsed.data);

    revalidatePath("/hr/employees");
    revalidatePath(`/hr/employees/${id}`);

    return { status: "success", data: employee };
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Terminates an employee. SUPER_ADMIN, ADMIN and HR_MANAGER.
 *
 * This is irreversible through the API — there is no "reinstate" endpoint, and
 * the call sets `employmentStatus` to TERMINATED rather than deleting the row.
 * The UI must therefore confirm before calling it.
 */
export async function terminateEmployeeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("employee:write");

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { status: "error", message: "That employee id is not valid." };
  }

  try {
    await terminateEmployee(id);

    revalidatePath("/hr/employees");
    revalidatePath(`/hr/employees/${id}`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
