"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { recordAdvance, recoverAdvance } from "@/lib/api/agent-advance";
import type { ActionState } from "@/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function money(value: FormDataEntryValue | null): number {
  return Number(String(value ?? "").replace(/,/g, ""));
}

/** Payroll Officer: record money given to an agent. It is recovered in the next payroll run. */
export async function recordAdvanceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("agentadvance:approve");

  const agentId = Number(formData.get("agentId"));
  const amount = money(formData.get("amount"));
  const advanceDate = String(formData.get("advanceDate") ?? "");
  const purpose = String(formData.get("purpose") ?? "").trim();

  if (!Number.isInteger(agentId) || agentId <= 0) {
    return { status: "error", message: "Choose an agent.", fieldErrors: { agentId: ["Required"] } };
  }
  if (!(amount > 0)) {
    return { status: "error", message: "Enter the advance amount.", fieldErrors: { amount: ["Required"] } };
  }
  if (!DATE_PATTERN.test(advanceDate)) {
    return { status: "error", message: "Choose the advance date.", fieldErrors: { advanceDate: ["Required"] } };
  }

  let advanceId: number;

  try {
    const advance = await recordAdvance({
      agentId,
      amount,
      advanceDate,
      purpose: purpose || undefined,
    });
    advanceId = advance.id;
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/payroll", "layout");
  redirect(`/payroll/advances/${advanceId}`);
}

/** Payroll Officer: record a direct repayment outside payroll. */
export async function recoverAdvanceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("agentadvance:approve");

  const advanceId = Number(formData.get("advanceId"));
  const amount = money(formData.get("amount"));

  if (!Number.isInteger(advanceId) || advanceId <= 0) {
    return { status: "error", message: "Unknown advance." };
  }
  if (!(amount > 0)) {
    return { status: "error", message: "Enter the amount recovered.", fieldErrors: { amount: ["Required"] } };
  }

  try {
    await recoverAdvance(advanceId, amount);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/payroll", "layout");
  return { status: "success", data: undefined };
}