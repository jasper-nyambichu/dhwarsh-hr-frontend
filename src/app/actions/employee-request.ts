"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { requireRole } from "@/app/lib/dal";
import { employeeSchema } from "@/app/lib/definitions";
import { api } from "@/app/lib/api-client";
import {
  approveEmployeeRequest,
  rejectEmployeeRequest,
} from "@/lib/api/employee-request";
import type { ActionState } from "@/types";
import type { EmployeeCreationRequestResponse } from "@/types/employee-request";

/**
 * HR_MANAGER's path for adding an employee.
 *
 * HR_MANAGER no longer calls `POST /employees` directly — that endpoint is
 * ADMIN/SUPER_ADMIN only. Instead this action calls `POST /employee-requests`,
 * which creates a pending request that an admin must approve before the
 * Employee row is created.
 *
 * The payload shape is identical to `EmployeeRequest.java`, so the same
 * `employeeSchema` used by `createEmployeeAction` validates it here.
 */

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

export async function submitEmployeeRequestAction(
  _prev: ActionState<EmployeeCreationRequestResponse>,
  formData: FormData,
): Promise<ActionState<EmployeeCreationRequestResponse>> {
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
    const request = await api.post<EmployeeCreationRequestResponse>(
      "/employee-requests",
      parsed.data,
    );

    refresh();

    return { status: "success", data: request };
  } catch (error) {
    return toActionError(error);
  }
}

const rejectSchema = z.object({
  id: z.coerce.number().int().positive(),
  reason: z.string().min(1, { message: "Give a reason for rejection." }).max(500),
});

/** Approve a pending employee creation request. ADMIN/SUPER_ADMIN. */
export async function approveEmployeeRequestAction(
  _prev: ActionState<EmployeeCreationRequestResponse>,
  formData: FormData,
): Promise<ActionState<EmployeeCreationRequestResponse>> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { status: "error", message: "Invalid request id." };
  }

  try {
    const result = await approveEmployeeRequest(id);

    refresh();

    return { status: "success", data: result };
  } catch (error) {
    return toActionError(error);
  }
}

/** Reject a pending employee creation request. ADMIN/SUPER_ADMIN. */
export async function rejectEmployeeRequestAction(
  _prev: ActionState<EmployeeCreationRequestResponse>,
  formData: FormData,
): Promise<ActionState<EmployeeCreationRequestResponse>> {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const parsed = rejectSchema.safeParse({
    id: formData.get("id"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await rejectEmployeeRequest(parsed.data.id, parsed.data.reason);

    refresh();

    return { status: "success", data: result };
  } catch (error) {
    return toActionError(error);
  }
}
