"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toActionError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { approveLoan, rejectLoan, requestMyLoan } from "@/lib/api/loan";
import type { ActionState } from "@/types";

function money(value: FormDataEntryValue | null): number {
  return Number(String(value ?? "").replace(/,/g, ""));
}

/** Employee: ask for a loan. Interest is set later by the approver, not here. */
export async function requestLoanAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requirePermission("loan:request");

  if (session.employeeId === null) {
    return { status: "error", message: "Your login is not linked to an employee record." };
  }

  const principalAmount = money(formData.get("amount"));
  const installmentAmount = money(formData.get("installment"));

  if (!(principalAmount > 0)) {
    return { status: "error", message: "Enter the loan amount.", fieldErrors: { amount: ["Required"] } };
  }
  if (!(installmentAmount > 0) || installmentAmount > principalAmount) {
    return {
      status: "error",
      message: "The monthly repayment must be more than zero and no more than the loan amount.",
      fieldErrors: { installment: ["Invalid amount"] },
    };
  }

  try {
    await requestMyLoan({ employeeId: session.employeeId, principalAmount, installmentAmount });
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/me/loans");
  redirect("/me/loans");
}

/** Payroll Officer: approve a pending loan, optionally fixing its flat interest rate. */
export async function approveLoanAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("loan:approve");

  const loanId = Number(formData.get("loanId"));
  const rawRate = String(formData.get("interestRate") ?? "").trim();
  const interestRate = rawRate === "" ? undefined : Number(rawRate);

  if (!Number.isInteger(loanId) || loanId <= 0) {
    return { status: "error", message: "Unknown loan." };
  }
  if (interestRate !== undefined && (!Number.isFinite(interestRate) || interestRate < 0 || interestRate > 100)) {
    return {
      status: "error",
      message: "Interest must be between 0 and 100 percent.",
      fieldErrors: { interestRate: ["0 – 100"] },
    };
  }

  try {
    await approveLoan(loanId, interestRate);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/payroll", "layout");
  return { status: "success", data: undefined };
}

export async function rejectLoanAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("loan:approve");

  const loanId = Number(formData.get("loanId"));
  if (!Number.isInteger(loanId) || loanId <= 0) {
    return { status: "error", message: "Unknown loan." };
  }

  try {
    await rejectLoan(loanId);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/payroll", "layout");
  return { status: "success", data: undefined };
}