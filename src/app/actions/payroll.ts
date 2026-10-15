"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { runPayroll } from "@/lib/api/payroll";
import type { ActionState } from "@/types";
import type { PayrollRunRequest } from "@/types/payroll";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function ids(formData: FormData, name: string): number[] {
  return formData
    .getAll(name)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

/**
 * Runs payroll for a period and scope. The whole run commits or none of it does,
 * and there is no way to reverse one afterwards — the form says so before it is sent.
 */
export async function runPayrollAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("payroll:run");

  const periodStart = String(formData.get("periodStart") ?? "");
  const periodEnd = String(formData.get("periodEnd") ?? "");
  const allEmployees = String(formData.get("scope") ?? "all") === "all";

  if (!DATE_PATTERN.test(periodStart) || !DATE_PATTERN.test(periodEnd)) {
    return {
      status: "error",
      message: "Choose both a start and an end date.",
      fieldErrors: {
        ...(DATE_PATTERN.test(periodStart) ? {} : { periodStart: ["Required"] }),
        ...(DATE_PATTERN.test(periodEnd) ? {} : { periodEnd: ["Required"] }),
      },
    };
  }

  if (periodEnd < periodStart) {
    return {
      status: "error",
      message: "The period end cannot be before the period start.",
      fieldErrors: { periodEnd: ["Must be on or after the start date"] },
    };
  }

  const request: PayrollRunRequest = {
    periodStart,
    periodEnd,
    allEmployees,
    branchIds: allEmployees ? [] : ids(formData, "branchIds"),
    agentIds: allEmployees ? [] : ids(formData, "agentIds"),
    departmentIds: allEmployees ? [] : ids(formData, "departmentIds"),
  };

  if (
    !allEmployees &&
    request.branchIds.length + request.agentIds.length + request.departmentIds.length === 0
  ) {
    return {
      status: "error",
      message: "Select at least one branch, agent or department — or run for all employees.",
    };
  }

  let runId: number;

  try {
    const run = await runPayroll(request);
    runId = run.id;
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/payroll", "layout");
  redirect(`/payroll/runs/${runId}`);
}