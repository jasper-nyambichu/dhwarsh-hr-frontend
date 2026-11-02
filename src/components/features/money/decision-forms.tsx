"use client";

import { useActionState, useId } from "react";

import {
  approveAdvanceAction,
  approveLoanAction,
  approvePaymentRequestAction,
  rejectAdvanceAction,
  rejectLoanAction,
  rejectPaymentRequestAction,
  releasePaymentRequestAction,
} from "@/app/actions/money-decisions";
import { FormMessage } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

const IDLE: ActionState = { status: "idle" };

const INPUT =
  "min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-base text-on-surface focus:outline-none focus:ring-1 focus:ring-primary md:text-sm";

const PRIMARY =
  "min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60";

type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>;

function fieldError(state: ActionState, name: string): string | undefined {
  return state.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined;
}

/** "Reject…" opens a small box asking for the reason, so the person who asked knows what to change. */
function RejectBox({ idName, id, action }: { idName: string; id: number; action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, IDLE);
  const reasonId = useId();
  const error = fieldError(state, "reason");

  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-lg border border-outline-variant px-5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low">
        Reject…
      </summary>
      <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
        <input type="hidden" name={idName} value={id} />
        <label htmlFor={reasonId} className="text-xs font-medium text-on-surface">
          Why is it being rejected?
        </label>
        <textarea id={reasonId} name="reason" required minLength={5} maxLength={500} rows={3} className={INPUT} />
        {error ? <p className="text-xs text-error">{error}</p> : null}
        <FormMessage state={state} successText="Rejected." />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-error px-5 text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          {pending ? "Rejecting…" : "Reject"}
        </button>
      </form>
    </details>
  );
}

function ApproveButton({ idName, id, action, label }: { idName: string; id: number; action: Action; label: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, IDLE);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name={idName} value={id} />
      <button type="submit" disabled={pending} className={`${PRIMARY} w-full`}>
        {pending ? "Saving…" : label}
      </button>
      {state.status === "error" ? <p className="text-xs text-error">{state.message}</p> : null}
    </form>
  );
}

/** Advance request: approve, or reject with a reason. */
export function AdvanceDecisionBar({ advanceId }: { advanceId: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <ApproveButton idName="advanceId" id={advanceId} action={approveAdvanceAction} label="Approve advance" />
      <RejectBox idName="advanceId" id={advanceId} action={rejectAdvanceAction} />
    </div>
  );
}

/** Payment request: approve (it is then ready to release), or reject with a reason. */
export function PaymentDecisionBar({ paymentRequestId }: { paymentRequestId: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <ApproveButton
        idName="paymentRequestId"
        id={paymentRequestId}
        action={approvePaymentRequestAction}
        label="Approve request"
      />
      <RejectBox idName="paymentRequestId" id={paymentRequestId} action={rejectPaymentRequestAction} />
    </div>
  );
}

/** Loan: approve with the interest the Administrator sets (a flat % of the loan), or reject. */
export function LoanDecisionBar({ loanId }: { loanId: number }) {
  const [approveState, approveAction, approving] = useActionState<ActionState, FormData>(approveLoanAction, IDLE);
  const [rejectState, rejectAction, rejecting] = useActionState<ActionState, FormData>(rejectLoanAction, IDLE);
  const interestId = useId();
  const interestError = fieldError(approveState, "interestRate");

  return (
    <div className="flex flex-col gap-3">
      <form action={approveAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <input type="hidden" name="loanId" value={loanId} />
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={interestId} className="text-xs font-medium text-on-surface">
            Interest (flat % of the loan)
          </label>
          <input
            id={interestId}
            name="interestRate"
            type="number"
            inputMode="decimal"
            min="0"
            max="100"
            step="0.01"
            placeholder="e.g. 10"
            className={INPUT}
          />
          {interestError ? <p className="text-xs text-error">{interestError}</p> : null}
        </div>
        <button type="submit" disabled={approving} className={PRIMARY}>
          {approving ? "Saving…" : "Approve loan"}
        </button>
      </form>

      <form
        action={rejectAction}
        onSubmit={(event) => {
          if (!window.confirm("Reject this loan request?")) event.preventDefault();
        }}
      >
        <input type="hidden" name="loanId" value={loanId} />
        <button
          type="submit"
          disabled={rejecting}
          className="min-h-11 w-full rounded-lg border border-outline-variant px-5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low disabled:opacity-60"
        >
          {rejecting ? "Rejecting…" : "Reject loan"}
        </button>
      </form>

      {approveState.status === "error" && !interestError ? <p className="text-xs text-error">{approveState.message}</p> : null}
      {rejectState.status === "error" ? <p className="text-xs text-error">{rejectState.message}</p> : null}
    </div>
  );
}

/** Admin: the money has been sent — record how. */
export function ReleaseForm({ paymentRequestId }: { paymentRequestId: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(releasePaymentRequestAction, IDLE);
  const referenceId = useId();
  const error = fieldError(state, "reference");

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Confirm the money has been sent? This marks the request as released.")) event.preventDefault();
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="paymentRequestId" value={paymentRequestId} />
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={referenceId} className="text-xs font-medium text-on-surface">
          How was it sent? (reference)
        </label>
        <input
          id={referenceId}
          name="reference"
          type="text"
          required
          minLength={3}
          maxLength={100}
          placeholder="Bank or M-Pesa reference"
          autoComplete="off"
          className={INPUT}
        />
        {error ? <p className="text-xs text-error">{error}</p> : null}
        {state.status === "error" && !error ? <p className="text-xs text-error">{state.message}</p> : null}
      </div>
      <button type="submit" disabled={pending} className={PRIMARY}>
        {pending ? "Saving…" : "Mark as released"}
      </button>
    </form>
  );
}