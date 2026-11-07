"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { updatePaySettings } from "@/lib/api/pay-settings";
import { calculateAgentPayments, getAgentPaymentReadiness } from "@/lib/api/settlement";
import type { ActionState } from "@/types";
import type { AgentPaymentReadiness } from "@/types/agent-portal";
import {
  CONTRIBUTION_MODES,
  type ContributionMode,
  type PaySettingsPayload,
} from "@/types/pay-model";

const MAX_AMOUNT = 1_000_000;

function readNumber(formData: FormData, name: string): number {
  const raw = String(formData.get(name) ?? "").trim();
  return raw === "" ? Number.NaN : Number(raw);
}

function readMode(formData: FormData, name: string): ContributionMode | undefined {
  const raw = String(formData.get(name) ?? "");
  return (CONTRIBUTION_MODES as readonly string[]).includes(raw) ? (raw as ContributionMode) : undefined;
}

/** NSSF: a percentage can't pass 100, a fixed amount can't be absurdly large. */
function checkContribution(
  label: string,
  field: string,
  mode: ContributionMode | undefined,
  value: number,
  errors: Record<string, string[]>,
) {
  if (!mode) {
    errors[`${field}Mode`] = [`Choose how ${label} is worked out`];
    return;
  }
  if (!Number.isFinite(value) || value < 0) {
    errors[`${field}Value`] = ["Enter zero or more"];
  } else if (mode === "PERCENT" && value > 100) {
    errors[`${field}Value`] = ["A percentage can't be more than 100"];
  } else if (mode === "FIXED" && value > MAX_AMOUNT) {
    errors[`${field}Value`] = ["That amount is too large"];
  }
}

/** Admin: set the daily rate, NSSF, the VAT rate and the deduction ceiling. */
export async function savePaySettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("settings:manage");

  const dailyRate = readNumber(formData, "dailyRate");
  const nssfMode = readMode(formData, "nssfMode");
  const nssfValue = readNumber(formData, "nssfValue");
  const ceiling = readNumber(formData, "deductionCeilingPercent");

  const vatRate = readNumber(formData, "vatRate");

  const fieldErrors: Record<string, string[]> = {};

  if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
    fieldErrors.dailyRate = ["Enter an amount greater than zero"];
  } else if (dailyRate > MAX_AMOUNT) {
    fieldErrors.dailyRate = ["That amount is too large"];
  }

  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    fieldErrors.vatRate = ["Enter a percentage from 0 to 100"];
  }

  checkContribution("NSSF", "nssf", nssfMode, nssfValue, fieldErrors);

  if (!Number.isFinite(ceiling) || ceiling < 1 || ceiling > 100) {
    fieldErrors.deductionCeilingPercent = ["Enter a percentage from 1 to 100"];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the fields below.", fieldErrors };
  }

  const payload: PaySettingsPayload = {
    vatRate,
    dailyRate,
    nssfMode: nssfMode!,
    nssfValue,
    deductionCeilingPercent: ceiling,
  };

  try {
    await updatePaySettings(payload);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin", "layout");
  return { status: "success", data: undefined };
}

/** Admin: reads what each branch still needs for a period, before anything is calculated. */
export async function checkAgentPaymentPeriodAction(
  periodStart: string,
  periodEnd: string,
): Promise<ActionState<AgentPaymentReadiness>> {
  await requirePermission("agentpayment:run");

  try {
    return { status: "success", data: await getAgentPaymentReadiness(periodStart, periodEnd) };
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Admin: work out what each agent is paid for a period, from the days in attendance. All or nothing:
 * if an agent was already paid for part of the period, nothing changes and the reason is shown.
 */
export async function calculateAgentPaymentsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("agentpayment:run");

  const periodStart = String(formData.get("periodStart") ?? "");
  const periodEnd = String(formData.get("periodEnd") ?? "");

  const fieldErrors: Record<string, string[]> = {};
  if (!periodStart) fieldErrors.periodStart = ["Choose a date"];
  if (!periodEnd) fieldErrors.periodEnd = ["Choose a date"];
  if (periodStart && periodEnd && periodEnd < periodStart) fieldErrors.periodEnd = ["Must be on or after the start"];

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the fields below.", fieldErrors };
  }

  try {
    await calculateAgentPayments({ periodStart, periodEnd });
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/agent", "layout");
  return { status: "success", data: undefined };
}