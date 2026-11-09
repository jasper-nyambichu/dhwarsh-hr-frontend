"use server";

import { refresh } from "next/cache";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import {
  approveAdvance,
  approvePaymentRequest,
  rejectAdvance,
  rejectPaymentRequest,
  releasePaymentRequest,
} from "@/lib/api/agent-money";
import { approveLoan, rejectLoan } from "@/lib/api/loan";
import type { ActionState } from "@/types";

function readId(formData: FormData, name: string): number {
  const value = Number(formData.get(name));
  return Number.isInteger(value) && value > 0 ? value : Number.NaN;
}

function readText(formData: FormData, name: string): string | undefined {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? undefined : value;
}

function refreshMoneyScreens() {
  refresh();
}

/** A rejection always says why, so the agent knows what to change. */
function rejectionReason(formData: FormData): { reason?: string; error?: ActionState } {
  const reason = readText(formData, "reason");
  if (!reason || reason.length < 5) {
    return {
      error: {
        status: "error",
        message: "Check the fields below.",
        fieldErrors: { reason: ["Give a reason of at least 5 characters"] },
      },
    };
  }
  if (reason.length > 500) {
    return {
      error: {
        status: "error",
        message: "Check the fields below.",
        fieldErrors: { reason: ["Keep it under 500 characters"] },
      },
    };
  }
  return { reason };
}

/* ---------------------------------------------------------------------- loans */

/** Admin: approve a loan. The interest is a flat percentage of the loan; leave it empty to keep the current rate. */
export async function approveLoanAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("loan:approve");

  const id = readId(formData, "loanId");
  if (Number.isNaN(id)) return { status: "error", message: "Unknown loan." };

  const raw = readText(formData, "interestRate");
  let interestRate: number | undefined;
  if (raw !== undefined) {
    interestRate = Number(raw);
    if (!Number.isFinite(interestRate) || interestRate < 0 || interestRate > 100) {
      return {
        status: "error",
        message: "Check the fields below.",
        fieldErrors: { interestRate: ["Enter a percentage from 0 to 100"] },
      };
    }
  }

  try {
    await approveLoan(id, interestRate);
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

export async function rejectLoanAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("loan:approve");

  const id = readId(formData, "loanId");
  if (Number.isNaN(id)) return { status: "error", message: "Unknown loan." };

  try {
    await rejectLoan(id);
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

/* ------------------------------------------------------------------- advances */

export async function approveAdvanceAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agentadvance:approve");

  const id = readId(formData, "advanceId");
  if (Number.isNaN(id)) return { status: "error", message: "Unknown advance." };

  try {
    await approveAdvance(id);
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

export async function rejectAdvanceAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agentadvance:approve");

  const id = readId(formData, "advanceId");
  if (Number.isNaN(id)) return { status: "error", message: "Unknown advance." };

  const { reason, error: problem } = rejectionReason(formData);
  if (problem) return problem;

  try {
    await rejectAdvance(id, reason!);
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

/* ----------------------------------------------------------- payment requests */

export async function approvePaymentRequestAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("paymentrequest:approve");

  const id = readId(formData, "paymentRequestId");
  if (Number.isNaN(id)) return { status: "error", message: "Unknown payment request." };

  try {
    await approvePaymentRequest(id);
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

export async function rejectPaymentRequestAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("paymentrequest:approve");

  const id = readId(formData, "paymentRequestId");
  if (Number.isNaN(id)) return { status: "error", message: "Unknown payment request." };

  const { reason, error: problem } = rejectionReason(formData);
  if (problem) return problem;

  try {
    await rejectPaymentRequest(id, reason!);
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}

/** Admin: the money has been sent. `reference` is how, kept on the request as proof. */
export async function releasePaymentRequestAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("paymentrequest:release");

  const id = readId(formData, "paymentRequestId");
  if (Number.isNaN(id)) return { status: "error", message: "Unknown payment request." };

  const reference = readText(formData, "reference");
  if (!reference || reference.length < 3) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: { reference: ["Enter how the money was sent, e.g. the bank or M-Pesa reference"] },
    };
  }
  if (reference.length > 100) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: { reference: ["Keep it under 100 characters"] },
    };
  }

  try {
    await releasePaymentRequest(id, reference);
  } catch (error) {
    return toActionError(error);
  }

  refreshMoneyScreens();
  return { status: "success", data: undefined };
}