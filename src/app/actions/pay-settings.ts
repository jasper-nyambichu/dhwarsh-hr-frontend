"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { updatePaySettings } from "@/lib/api/pay-settings";
import { calculateAgentPayments, getAgentPaymentReadiness, previewAgentPayments, undoAgentPayment } from "@/lib/api/settlement";
import type { ActionState } from "@/types";
import type { AgentPaymentDetail, AgentPaymentReadiness } from "@/types/agent-portal";
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

/** Admin: set NSSF, the VAT rate and the deduction ceiling. (Pay comes from each employee's own salary.) */
export async function savePaySettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("settings:manage");

  const nssfMode = readMode(formData, "nssfMode");
  const nssfValue = readNumber(formData, "nssfValue");
  const ceiling = readNumber(formData, "deductionCeilingPercent");

  const vatRate = readNumber(formData, "vatRate");

  const fieldErrors: Record<string, string[]> = {};

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
    nssfMode: nssfMode!,
    nssfValue,
    deductionCeilingPercent: ceiling,
  };

  try {
    await updatePaySettings(payload);
  } catch (error) {
    return toActionError(error);
  }

  refresh();
  return { status: "success", data: undefined };
}

/**
 * Admin: a dry run of the payroll for a period: each agent's payment line by line. Nothing is saved or deducted,
 * and agents see nothing. The Admin runs the period afterwards, once satisfied.
 */
export async function previewAgentPaymentsAction(
  periodStart: string,
  periodEnd: string,
): Promise<ActionState<AgentPaymentDetail[]>> {
  await requirePermission("agentpayment:run");

  try {
    return { status: "success", data: await previewAgentPayments({ periodStart, periodEnd }) };
  } catch (error) {
    return toActionError(error);
  }
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

  refresh();
  return { status: "success", data: undefined };
}
/**
 * Admin: undoes an agent payment run by mistake or as a test, as if it had never been run. Loans, damages and
 * advances it took are given back (an advance stays approved, just owed again), and its money request, payslips and
 * invoice are removed. Back to Pay Rates afterwards.
 */
export async function undoAgentPaymentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("agentpayment:run");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown payment." };

  try {
    await undoAgentPayment(id);
  } catch (error) {
    return toActionError(error);
  }

  redirect("/admin/pay-settings?undone=1");
}
