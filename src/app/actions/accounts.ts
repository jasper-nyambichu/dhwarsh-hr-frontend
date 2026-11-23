"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { flashToast } from "@/app/lib/flash";
import { payAgentInvoice } from "@/lib/api/agent-money";
import type { ActionState } from "@/types";

/**
 * Accounts Office actions. Mirrors `PaymentRequestController.pay` (POST /payment-requests/{id}/pay, multipart).
 *
 * The backend checks everything again (and refuses where the organisation has no Accounts Office); these checks
 * only give the person a quicker, field-by-field answer.
 */

const METHODS = ["MPESA", "CHEQUE", "MANUAL"] as const;
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const EVIDENCE_TYPES = ["application/pdf", "image/png", "image/jpeg"];

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function invalid(fieldErrors: Record<string, string[]>): ActionState {
  return { status: "error", message: "Check the fields below.", fieldErrors };
}

/** Pay one agent invoice and record how: M-Pesa (code), cheque (number, bank, date) or manual (description). */
export async function recordAgentPaymentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("paymentrequest:pay");

  const id = Number(formData.get("paymentRequestId"));
  if (!Number.isInteger(id) || id <= 0) return { status: "error", message: "Unknown payment." };

  const method = text(formData, "method").toUpperCase();
  if (!(METHODS as readonly string[]).includes(method)) {
    return invalid({ method: ["Choose how the agent was paid: M-Pesa, cheque or cash."] });
  }

  const today = new Date().toISOString().slice(0, 10);
  const paidOn = text(formData, "paidOn") || today;
  if (paidOn > today) return invalid({ paidOn: ["The payment date cannot be in the future."] });

  const body = new FormData();
  body.set("method", method);
  body.set("paidOn", paidOn);

  if (method === "MPESA") {
    const code = text(formData, "mpesaCode").toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(code)) {
      return invalid({ mpesaCode: ["An M-Pesa code is 10 letters and numbers, e.g. QGH7K2L9XP."] });
    }
    body.set("reference", code);
  } else if (method === "CHEQUE") {
    const number = text(formData, "chequeNumber").toUpperCase();
    const bank = text(formData, "chequeBank");
    const date = text(formData, "chequeDate");
    const errors: Record<string, string[]> = {};
    if (!/^[A-Z0-9-]{4,30}$/.test(number)) errors.chequeNumber = ["Enter the cheque number as printed on the cheque."];
    if (bank.length < 2) errors.chequeBank = ["Enter the bank the cheque is drawn on."];
    if (!date) errors.chequeDate = ["Enter the date written on the cheque."];
    if (Object.keys(errors).length > 0) return invalid(errors);
    body.set("chequeNumber", number);
    body.set("chequeBank", bank);
    body.set("chequeDate", date);
  } else {
    const reference = text(formData, "manualReference");
    if (reference.length < 3) {
      return invalid({ manualReference: ["Enter the cash receipt number."] });
    }
    if (reference.length > 100) return invalid({ manualReference: ["Keep it under 100 characters."] });
    body.set("reference", reference);
  }

  const note = text(formData, "note");
  if (note.length > 500) return invalid({ note: ["Keep the note under 500 characters."] });
  if (note) body.set("note", note);

  const evidence = formData.get("evidence");
  if (evidence instanceof File && evidence.size > 0) {
    if (evidence.size > MAX_EVIDENCE_BYTES) return invalid({ evidence: ["The file must be 5 MB or smaller."] });
    if (evidence.type && !EVIDENCE_TYPES.includes(evidence.type)) {
      return invalid({ evidence: ["Attach a PDF, PNG or JPEG file."] });
    }
    body.set("evidence", evidence, evidence.name);
  }

  try {
    await payAgentInvoice(id, body);
  } catch (error) {
    return toActionError(error);
  }

  refresh();
  // The paid invoice leaves "To pay" (and its form with it), so say so on the page it lands on.
  await flashToast("success", "Payment recorded. The Admin and the agent have been told.");
  const returnTo = text(formData, "returnTo");
  const target = returnTo.startsWith("/accounts/") && !returnTo.startsWith("//") ? returnTo : "/accounts/payments?tab=paid";
  redirect(`${target}${target.includes("?") ? "&" : "?"}paid=1`);
}
