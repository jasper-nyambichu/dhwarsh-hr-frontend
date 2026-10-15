"use client";

import { useActionState } from "react";

import { approveLoanAction, rejectLoanAction } from "@/app/actions/loan";
import { BentoCard } from "@/components/shared/bento-card";
import type { ActionState } from "@/types";

const INPUT =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary";

/** Approve (with the flat interest rate) or reject a pending loan. */
export function LoanDecision({ loanId }: { loanId: number }) {
  const [approveState, approveAction, approving] = useActionState<ActionState, FormData>(approveLoanAction, { status: "idle" });
  const [rejectState, rejectAction, rejecting] = useActionState<ActionState, FormData>(rejectLoanAction, { status: "idle" });

  const busy = approving || rejecting;
  const error =
    approveState.status === "error" ? approveState.message : rejectState.status === "error" ? rejectState.message : null;
  const rateError = approveState.status === "error" ? approveState.fieldErrors?.interestRate?.[0] : undefined;

  return (
    <BentoCard title="Decision">
      <form action={approveAction} className="flex flex-col gap-3">
        <input type="hidden" name="loanId" value={loanId} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-secondary">Interest rate (% of principal, flat)</span>
          <input type="number" name="interestRate" min={0} max={100} step="0.01" defaultValue={0} className={INPUT} />
          {rateError ? <span className="text-xs text-error">{rateError}</span> : null}
        </label>
        <p className="text-xs text-on-surface-variant">
          The employee owes principal plus this interest. Instalments are then deducted in each payroll run.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {approving ? "Approving…" : "Approve Loan"}
        </button>
      </form>

      <form action={rejectAction} className="mt-3">
        <input type="hidden" name="loanId" value={loanId} />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg border border-error px-4 py-2 font-body-md text-body-md font-semibold text-error transition-colors hover:bg-error/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {rejecting ? "Rejecting…" : "Reject Loan"}
        </button>
      </form>

      {error ? (
        <div role="alert" className="mt-3 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
          {error}
        </div>
      ) : null}
    </BentoCard>
  );
}