"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { updatePaySettings } from "@/lib/api/pay-settings";
import type { ActionState } from "@/types";
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

/** SHIF / NSSF: a percentage can't pass 100, a fixed amount can't be absurdly large. */
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

/** Admin: set the daily rate, SHIF/NSSF, the optional statutory switches and the deduction ceiling. */
export async function savePaySettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("settings:manage");

  const dailyRate = readNumber(formData, "dailyRate");
  const shifMode = readMode(formData, "shifMode");
  const shifValue = readNumber(formData, "shifValue");
  const nssfMode = readMode(formData, "nssfMode");
  const nssfValue = readNumber(formData, "nssfValue");
  const ceiling = readNumber(formData, "deductionCeilingPercent");

  // The backend requires the VAT rate on every save; it arrives unchanged from the loaded settings.
  const vatRaw = readNumber(formData, "vatRate");
  const vatRate = Number.isFinite(vatRaw) && vatRaw >= 0 && vatRaw <= 100 ? vatRaw : 0;

  const fieldErrors: Record<string, string[]> = {};

  if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
    fieldErrors.dailyRate = ["Enter an amount greater than zero"];
  } else if (dailyRate > MAX_AMOUNT) {
    fieldErrors.dailyRate = ["That amount is too large"];
  }

  checkContribution("SHIF", "shif", shifMode, shifValue, fieldErrors);
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
    shifMode: shifMode!,
    shifValue,
    nssfMode: nssfMode!,
    nssfValue,
    // An unticked checkbox is absent from the form, so these are always sent: that is how a switch is turned off.
    applyHousingLevy: formData.get("applyHousingLevy") === "on",
    applyPaye: formData.get("applyPaye") === "on",
    applyNita: formData.get("applyNita") === "on",
    deductionCeilingPercent: ceiling,
  };

  try {
    await updatePaySettings(payload);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/payroll", "layout");
  return { status: "success", data: undefined };
}