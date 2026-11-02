"use client";

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";

import {
  cancelPaymentRequestAction,
  recordPaymentAction,
  requestAdvanceAction,
  requestLoanAction,
  submitPaymentRequestAction,
} from "@/app/actions/agent-money";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage } from "@/components/shared/form-field";
import { formatKes } from "@/lib/money-format";
import type { ActionState } from "@/types";

// 44px tall for easy tapping; 16px text on phones so iOS does not zoom the page when focusing.
const INPUT =
  "min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-base text-on-surface focus:outline-none focus:ring-1 focus:ring-primary md:text-sm";

const IDLE: ActionState = { status: "idle" };

function errorsOf(state: ActionState): Record<string, string[] | undefined> {
  return state.status === "error" ? (state.fieldErrors ?? {}) : {};
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-on-surface">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

type EmployeeOption = { id: number; fullName: string; employeeNumber: string };

/** Ask for a loan for one of the agent's employees. The Administrator reviews it and fixes the interest. */
export function LoanRequestForm({ employees }: { employees: EmployeeOption[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(requestLoanAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const [principal, setPrincipal] = useState("");
  const [installment, setInstallment] = useState("");
  const id = useId();
  const errors = errorsOf(state);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setPrincipal("");
      setInstallment("");
    }
  }, [state]);

  const p = Number(principal);
  const i = Number(installment);
  const months = p > 0 && i > 0 ? Math.ceil(p / i) : null;

  return (
    <BentoCard title="Request a loan" subtitle="For one of your employees. The Administrator reviews it and sets the interest.">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <Field id={`${id}-employee`} label="Employee" error={errors.employeeId?.[0]}>
          <select id={`${id}-employee`} name="employeeId" required defaultValue="" className={INPUT}>
            <option value="" disabled>
              Choose an employee…
            </option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName} ({employee.employeeNumber})
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${id}-principal`} label="Loan amount (KES)" error={errors.principalAmount?.[0]}>
          <input
            id={`${id}-principal`}
            name="principalAmount"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            required
            value={principal}
            onChange={(event) => setPrincipal(event.target.value)}
            className={INPUT}
          />
        </Field>

        <Field
          id={`${id}-installment`}
          label="Monthly instalment (KES)"
          error={errors.installmentAmount?.[0]}
          hint={months ? `About ${months} monthly instalment${months === 1 ? "" : "s"}, taken from their pay automatically.` : "What they can afford to repay each month."}
        >
          <input
            id={`${id}-installment`}
            name="installmentAmount"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            required
            value={installment}
            onChange={(event) => setInstallment(event.target.value)}
            className={INPUT}
          />
        </Field>

        <div aria-live="polite">
          <FormMessage state={state} successText="Loan request sent. You'll be notified when the Administrator decides." />
        </div>
        <SubmitButton pending={pending} label="Send loan request" pendingLabel="Sending…" />
        {employees.length === 0 ? (
          <p className="text-xs text-on-surface-variant">You have no active employees to request a loan for yet.</p>
        ) : null}
      </form>
    </BentoCard>
  );
}

/** Ask the Administrator for an advance. It is only recovered from payroll once approved. */
export function AdvanceRequestForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(requestAdvanceAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();
  const errors = errorsOf(state);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <BentoCard title="Request an advance" subtitle="Recovered from your next payroll once the Administrator approves it.">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <Field id={`${id}-amount`} label="Amount (KES)" error={errors.amount?.[0]}>
          <input
            id={`${id}-amount`}
            name="amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            required
            className={INPUT}
          />
        </Field>
        <Field id={`${id}-purpose`} label="What is it for?" error={errors.purpose?.[0]}>
          <textarea id={`${id}-purpose`} name="purpose" required maxLength={255} rows={3} className={INPUT} />
        </Field>
        <div aria-live="polite">
          <FormMessage state={state} successText="Advance request sent. You'll be notified when the Administrator decides." />
        </div>
        <SubmitButton pending={pending} label="Send advance request" pendingLabel="Sending…" />
      </form>
    </BentoCard>
  );
}

/** Ask the Administrator for money to pay employees. The Administrator releases it once approved. */
export function PaymentRequestForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(submitPaymentRequestAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();
  const errors = errorsOf(state);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <BentoCard title="Request money" subtitle="Ask for the money you need to pay your employees.">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <Field id={`${id}-amount`} label="Amount (KES)" error={errors.amount?.[0]}>
          <input
            id={`${id}-amount`}
            name="amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            required
            className={INPUT}
          />
        </Field>
        <Field
          id={`${id}-purpose`}
          label="What is it for?"
          error={errors.purpose?.[0]}
          hint="For example: October wages for the Nakuru team."
        >
          <textarea id={`${id}-purpose`} name="purpose" required maxLength={500} rows={3} className={INPUT} />
        </Field>
        <div aria-live="polite">
          <FormMessage state={state} successText="Request sent to the Administrator for approval." />
        </div>
        <SubmitButton pending={pending} label="Send request" pendingLabel="Sending…" />
      </form>
    </BentoCard>
  );
}

type ReleasedRequest = { id: number; label: string; remaining: number };

/** Record a payment made to an employee by M-Pesa, against money the Administrator has released. */
export function PaymentRecordForm({
  requests,
  employees,
}: {
  requests: ReleasedRequest[];
  employees: EmployeeOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(recordPaymentAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const [requestId, setRequestId] = useState(requests[0] ? String(requests[0].id) : "");
  const id = useId();
  const errors = errorsOf(state);

  useEffect(() => {
    if (state.status === "success") {
      const keep = requestId;
      formRef.current?.reset();
      setRequestId(keep); // stay on the same request so several payments can be recorded in a row
    }
  }, [state, requestId]);

  const selected = requests.find((request) => String(request.id) === requestId);

  return (
    <BentoCard
      title="Record an M-Pesa payment"
      subtitle="After you pay an employee, record it here with the M-Pesa transaction code."
    >
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <Field
          id={`${id}-request`}
          label="Paid from"
          error={errors.paymentRequestId?.[0]}
          hint={selected ? `${formatKes(selected.remaining)} still unpaid on this request.` : undefined}
        >
          <select
            id={`${id}-request`}
            name="paymentRequestId"
            required
            value={requestId}
            onChange={(event) => setRequestId(event.target.value)}
            className={INPUT}
          >
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                {request.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${id}-employee`} label="Employee" error={errors.employeeId?.[0]}>
          <select id={`${id}-employee`} name="employeeId" required defaultValue="" className={INPUT}>
            <option value="" disabled>
              Choose an employee…
            </option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName} ({employee.employeeNumber})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${id}-amount`} label="Amount paid (KES)" error={errors.amount?.[0]}>
            <input
              id={`${id}-amount`}
              name="amount"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              required
              className={INPUT}
            />
          </Field>
          <Field
            id={`${id}-code`}
            label="M-Pesa code"
            error={errors.mpesaCode?.[0]}
            hint="10 letters and numbers, from the M-Pesa message."
          >
            <input
              id={`${id}-code`}
              name="mpesaCode"
              type="text"
              required
              maxLength={10}
              minLength={10}
              pattern="[A-Za-z0-9]{10}"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className={`${INPUT} font-mono uppercase`}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${id}-date`} label="Date paid" hint="Leave empty for today.">
            <input id={`${id}-date`} name="paidOn" type="date" className={INPUT} />
          </Field>
          <Field id={`${id}-note`} label="Note (optional)" error={errors.note?.[0]}>
            <input id={`${id}-note`} name="note" type="text" maxLength={255} className={INPUT} />
          </Field>
        </div>

        <div aria-live="polite">
          <FormMessage state={state} successText="Payment recorded." />
        </div>
        <SubmitButton pending={pending} label="Record payment" pendingLabel="Saving…" />
      </form>
    </BentoCard>
  );
}

/** Withdraw a request that is still waiting for the Administrator. */
export function CancelPaymentRequestButton({ paymentRequestId }: { paymentRequestId: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(cancelPaymentRequestAction, IDLE);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Cancel this request? The Administrator will no longer see it.")) event.preventDefault();
      }}
      className="flex flex-col gap-1"
    >
      <input type="hidden" name="paymentRequestId" value={paymentRequestId} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg border border-outline-variant px-4 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low disabled:opacity-60"
      >
        {pending ? "Cancelling…" : "Cancel request"}
      </button>
      {state.status === "error" ? <p className="text-xs text-error">{state.message}</p> : null}
    </form>
  );
}