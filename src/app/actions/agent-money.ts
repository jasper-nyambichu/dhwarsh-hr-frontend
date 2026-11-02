"use server";

import { revalidatePath } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import {
  cancelPaymentRequest,
  recordEmployeePayment,
  requestAdvance,
  requestAgentLoan,
  submitPaymentRequest,
} from "@/lib/api/agent-money";
import type { ActionState } from "@/types";

const MAX_AMOUNT = 10_000_000;
const MPESA_CODE = /^[A-Za-z0-9]{10}$/;

function readNumber(formData: FormData, name: string): number {
  const raw = String(formData.get(name) ?? "").trim();
  return raw === "" ? Number.NaN : Number(raw);
}

function readText(formData: FormData, name: string): string | undefined {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? undefined : value;
}

function readId(formData: FormData, name: string): number {
  const value = Number(formData.get(name));
  return Number.isInteger(value) && value > 0 ? value : Number.NaN;
}

function validAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= MAX_AMOUNT;
}

function invalid(fieldErrors: Record<string, string[]>): ActionState {
  return { status: "error", message: "Check the fields below.", fieldErrors };
}

/** Every screen that shows these figures is refreshed after a change. */
function refreshMoneyScreens() {
  revalidatePath("/agent", "layout");
  revalidatePath("/admin", "layout");
}

/** Agent: ask for a loan for one of THEIR employees. The Administrator reviews it and fixes the interest. */
export async function requestLoanAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("loan:request");

  const employeeId = readId(formData, "employeeId");
  const principalAmount = readNumber(formData, "principalAmount");
  const installmentAmount = readNumber(formData, "installmentAmount");

  const errors: Record<string, string[]> = {};
  if (Number.isNaN(employeeId)) errors.employeeId = ["Choose the employee"];
  if (!validAmount(principalAmount)) errors.principalAmount = ["Enter the amount to lend"];
  if (!validAmount(installmentAmount)) errors.installmentAmount = ["Enter the monthly instalment"];
  else if (validAmount(principalAmount) && installmentAmount > principalAmount) {
    errors.installmentAmount = ["An instalment can't be more than the loan"];
  }
  if (Object.keys(errors).length > 0) return invalid(errors);

  try {
    await requestAgentLoan({ employeeId, principalAmount, installmentAmount });
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

/** Agent: ask the Administrator for an advance. */
export async function requestAdvanceAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agentadvance:request");

  const amount = readNumber(formData, "amount");
  const purpose = readText(formData, "purpose");

  const errors: Record<string, string[]> = {};
  if (!validAmount(amount)) errors.amount = ["Enter the amount you need"];
  if (!purpose) errors.purpose = ["Say what the advance is for"];
  else if (purpose.length > 255) errors.purpose = ["Keep it under 255 characters"];
  if (Object.keys(errors).length > 0) return invalid(errors);

  try {
    await requestAdvance({ amount, purpose: purpose! });
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

/** Agent: ask the Administrator for money to pay their employees. */
export async function submitPaymentRequestAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("paymentrequest:request");

  const amount = readNumber(formData, "amount");
  const purpose = readText(formData, "purpose");

  const errors: Record<string, string[]> = {};
  if (!validAmount(amount)) errors.amount = ["Enter the amount you need"];
  if (!purpose) errors.purpose = ["Say what the money is for"];
  else if (purpose.length > 500) errors.purpose = ["Keep it under 500 characters"];
  if (Object.keys(errors).length > 0) return invalid(errors);

  try {
    await submitPaymentRequest({ amount, purpose: purpose! });
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

/** Agent: withdraw a payment request that is still waiting for the Administrator. */
export async function cancelPaymentRequestAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("paymentrequest:request");

  const id = readId(formData, "paymentRequestId");
  if (Number.isNaN(id)) return { status: "error", message: "Unknown payment request." };

  try {
    await cancelPaymentRequest(id);
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

/** Agent: record a payment made to an employee by M-Pesa, against a request the Accounts Office released. */
export async function recordPaymentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("employeepayment:record");

  const paymentRequestId = readId(formData, "paymentRequestId");
  const employeeId = readId(formData, "employeeId");
  const amount = readNumber(formData, "amount");
  const mpesaCode = readText(formData, "mpesaCode");
  const paidOn = readText(formData, "paidOn");
  const note = readText(formData, "note");

  const errors: Record<string, string[]> = {};
  if (Number.isNaN(paymentRequestId)) errors.paymentRequestId = ["Choose the request this is paid from"];
  if (Number.isNaN(employeeId)) errors.employeeId = ["Choose the employee"];
  if (!validAmount(amount)) errors.amount = ["Enter the amount you paid"];
  if (!mpesaCode || !MPESA_CODE.test(mpesaCode)) {
    errors.mpesaCode = ["An M-Pesa code is 10 letters and numbers, e.g. QGH7K2L9XP"];
  }
  if (note && note.length > 255) errors.note = ["Keep it under 255 characters"];
  if (Object.keys(errors).length > 0) return invalid(errors);

  try {
    await recordEmployeePayment({
      paymentRequestId,
      employeeId,
      amount,
      mpesaCode: mpesaCode!.toUpperCase(),
      paidOn,
      note,
    });
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}