"use client";

import { useActionState, useState } from "react";

import { requestLoanAction } from "@/app/actions/loan";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";
import type { ActionState } from "@/types";

const INPUT =
  "w-full rounded-lg border border-[#E9EFF5] py-3 px-4 font-body-md text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function LoanRequestForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(requestLoanAction, { status: "idle" });
  const [amount, setAmount] = useState("");
  const [installment, setInstallment] = useState("");

  const fieldError = (field: string) =>
    state.status === "error" ? state.fieldErrors?.[field]?.[0] : undefined;

  const principal = Number(amount);
  const monthly = Number(installment);
  const months = principal > 0 && monthly > 0 ? Math.ceil(principal / monthly) : null;

  return (
    <form action={formAction} className="space-y-gutter">
      <div className="rounded-card bg-white p-card-padding shadow-[0_2px_8px_rgba(11,42,69,.06)]">
        <h2 className="mb-6 flex items-center gap-2 font-page-title text-page-title text-on-surface">
          <Icon name="edit_document" className="text-primary" />
          Loan Details
        </h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="amount" className="mb-2 block font-label-rail uppercase text-on-surface-variant">
              Loan Amount (KES)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 50000"
              className={INPUT}
            />
            {fieldError("amount") ? <p className="mt-1 text-xs text-error">{fieldError("amount")}</p> : null}
          </div>

          <div>
            <label htmlFor="installment" className="mb-2 block font-label-rail uppercase text-on-surface-variant">
              Monthly Repayment (KES)
            </label>
            <input
              id="installment"
              name="installment"
              type="number"
              min="1"
              step="0.01"
              required
              value={installment}
              onChange={(event) => setInstallment(event.target.value)}
              placeholder="e.g. 5000"
              className={INPUT}
            />
            {fieldError("installment") ? <p className="mt-1 text-xs text-error">{fieldError("installment")}</p> : null}
          </div>

          <div className="rounded-lg border border-surface-variant bg-surface-bright p-4">
            <p className="mb-1 font-label-rail uppercase text-on-surface-variant">Estimated repayment</p>
            <p className="font-card-stat text-card-stat text-primary">
              {months ? `${months} month${months === 1 ? "" : "s"}` : "—"}
            </p>
            {months ? (
              <p className="mt-1 text-xs text-on-surface-variant">
                {formatMoney(monthly)} a month on {formatMoney(principal)}, before interest.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-surface-variant pt-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" required className="size-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0" />
              <span className="font-body-md text-body-md text-on-surface-variant">
                I agree to the{" "}
                <a href="/legal/loan-terms" className="text-primary hover:underline">
                  Loan Terms &amp; Conditions
                </a>
              </span>
            </label>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-lg bg-[#0B2A45] px-8 py-3 font-bold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Submitting…" : "Submit Request"}
              <Icon name="send" className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {state.status === "error" ? (
        <div role="alert" className="rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error">
          {state.message}
        </div>
      ) : null}

      <div className="flex items-start gap-4 rounded-xl border border-secondary-fixed bg-secondary-fixed/50 p-4">
        <Icon name="info" className="mt-1 text-primary" />
        <div>
          <h4 className="mb-1 font-label-rail uppercase text-primary">Approval Process</h4>
          <p className="font-body-md text-body-md text-on-surface-variant">
            The payroll team reviews each request and sets the interest rate when approving. Once approved, your monthly repayment is deducted from your pay automatically.
          </p>
        </div>
      </div>
    </form>
  );
}