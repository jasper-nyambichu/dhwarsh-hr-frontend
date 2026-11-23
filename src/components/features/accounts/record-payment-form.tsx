"use client";

import { useActionState, useId, useState } from "react";

import { recordAgentPaymentAction } from "@/app/actions/accounts";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage } from "@/components/shared/form-field";
import { Icon } from "@/components/ui/icon";
import { formatKes } from "@/lib/money-format";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";
import type { PaymentMethod } from "@/types/money-flow";

const IDLE: ActionState = { status: "idle" };

const INPUT =
  "min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-base text-on-surface focus:outline-none focus:ring-1 focus:ring-primary md:text-sm";
const LABEL = "mb-1 block text-xs font-semibold text-on-surface";

const METHODS: { id: PaymentMethod; label: string; icon: string; hint: string }[] = [
  { id: "MPESA", label: "M-Pesa", icon: "smartphone", hint: "Transaction code from the M-Pesa message" },
  { id: "CHEQUE", label: "Cheque", icon: "money", hint: "Cheque number, bank and date" },
  { id: "MANUAL", label: "Manual", icon: "edit_note", hint: "Cash or bank transfer, with its reference" },
];

function fieldError(state: ActionState, name: string): string | undefined {
  return state.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined;
}

/**
 * The Accounts Office pays one agent invoice and records how, with the proof that tracks the transaction:
 *   M-Pesa  the transaction code;
 *   Cheque  the cheque number, the bank it is drawn on and the date written on it;
 *   Manual  a description with its reference (cash receipt number, bank transfer reference…).
 * Plus the day it was paid, an optional note and an optional PDF/photo (receipt, M-Pesa message, cheque).
 * Once saved the payment is final; the Admin and the agent are told straight away.
 */
export function RecordPaymentForm({
  paymentRequestId,
  amount,
  agentName,
  today,
  returnTo = "/accounts/payments?tab=paid",
}: {
  /** Where to go once it is recorded (an Accounts Office page). */
  returnTo?: string;
  paymentRequestId: number;
  amount: number;
  agentName: string;
  /** "yyyy-MM-dd", the default payment date and the latest allowed. */
  today: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(recordAgentPaymentAction, IDLE);
  const [method, setMethod] = useState<PaymentMethod>("MPESA");
  const id = useId();

  if (state.status === "success") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-tertiary-container/20 p-3 text-sm font-medium text-tertiary">
        <Icon name="check_circle" className="text-[18px]" />
        Payment recorded. The Admin and {agentName} have been told.
      </p>
    );
  }

  return (
    <ConfirmForm
      action={formAction}
      confirm={{
        title: "Record this payment?",
        message: `${formatKes(amount)} to ${agentName}. Once recorded it is final, and the Admin and the agent are told.`,
        subject: METHODS.find((m) => m.id === method)?.label,
        confirmLabel: "Record payment",
        icon: "payments",
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="paymentRequestId" value={paymentRequestId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="method" value={method} />

      <fieldset>
        <legend className={LABEL}>Mode of payment</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup">
          {METHODS.map((item) => {
            const active = item.id === method;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMethod(item.id)}
                className={cn(
                  "flex min-h-11 items-start gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active ? "border-primary bg-primary-fixed/40" : "border-outline-variant hover:bg-surface-container-low",
                )}
              >
                <Icon name={item.icon} className={cn("mt-0.5 text-[20px]", active ? "text-primary" : "text-outline")} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-on-surface">{item.label}</span>
                  <span className="block text-[11px] leading-snug text-on-surface-variant">{item.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        {fieldError(state, "method") ? <p className="mt-1 text-xs text-error">{fieldError(state, "method")}</p> : null}
      </fieldset>

      {method === "MPESA" ? (
        <div>
          <label htmlFor={`${id}-mpesa`} className={LABEL}>
            M-Pesa transaction code <span className="text-error">*</span>
          </label>
          <input
            id={`${id}-mpesa`}
            name="mpesaCode"
            required
            minLength={10}
            maxLength={10}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. QGH7K2L9XP"
            className={cn(INPUT, "font-mono uppercase placeholder:normal-case")}
          />
          {fieldError(state, "mpesaCode") ? <p className="mt-1 text-xs text-error">{fieldError(state, "mpesaCode")}</p> : null}
        </div>
      ) : null}

      {method === "CHEQUE" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor={`${id}-cheque`} className={LABEL}>
              Cheque number <span className="text-error">*</span>
            </label>
            <input id={`${id}-cheque`} name="chequeNumber" required maxLength={30} autoComplete="off" placeholder="e.g. 000123" className={cn(INPUT, "font-mono")} />
            {fieldError(state, "chequeNumber") ? <p className="mt-1 text-xs text-error">{fieldError(state, "chequeNumber")}</p> : null}
          </div>
          <div>
            <label htmlFor={`${id}-bank`} className={LABEL}>
              Bank <span className="text-error">*</span>
            </label>
            <input id={`${id}-bank`} name="chequeBank" required maxLength={100} autoComplete="off" placeholder="e.g. KCB, Kisii" className={INPUT} />
            {fieldError(state, "chequeBank") ? <p className="mt-1 text-xs text-error">{fieldError(state, "chequeBank")}</p> : null}
          </div>
          <div>
            <label htmlFor={`${id}-cdate`} className={LABEL}>
              Date on the cheque <span className="text-error">*</span>
            </label>
            <input id={`${id}-cdate`} name="chequeDate" type="date" required className={INPUT} />
            {fieldError(state, "chequeDate") ? <p className="mt-1 text-xs text-error">{fieldError(state, "chequeDate")}</p> : null}
          </div>
        </div>
      ) : null}

      {method === "MANUAL" ? (
        <div>
          <label htmlFor={`${id}-manual`} className={LABEL}>
            How was it paid? <span className="text-error">*</span>
          </label>
          <input
            id={`${id}-manual`}
            name="manualReference"
            required
            minLength={3}
            maxLength={100}
            autoComplete="off"
            placeholder="e.g. Cash, receipt no. 0457 / Bank transfer ref FT24113XYZ"
            className={INPUT}
          />
          {fieldError(state, "manualReference") ? <p className="mt-1 text-xs text-error">{fieldError(state, "manualReference")}</p> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-paid`} className={LABEL}>
            Date paid
          </label>
          <input id={`${id}-paid`} name="paidOn" type="date" defaultValue={today} max={today} className={INPUT} />
          {fieldError(state, "paidOn") ? <p className="mt-1 text-xs text-error">{fieldError(state, "paidOn")}</p> : null}
        </div>
        <div>
          <label htmlFor={`${id}-file`} className={LABEL}>
            Proof of payment <span className="font-normal text-outline">(PDF or photo, optional)</span>
          </label>
          <input
            id={`${id}-file`}
            name="evidence"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="block min-h-11 w-full rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface-variant file:mr-3 file:rounded-md file:border-0 file:bg-primary-fixed file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
          />
          {fieldError(state, "evidence") ? <p className="mt-1 text-xs text-error">{fieldError(state, "evidence")}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-note`} className={LABEL}>
          Note <span className="font-normal text-outline">(optional)</span>
        </label>
        <textarea id={`${id}-note`} name="note" rows={2} maxLength={500} className={cn(INPUT, "py-2")} />
        {fieldError(state, "note") ? <p className="mt-1 text-xs text-error">{fieldError(state, "note")}</p> : null}
      </div>

      <FormMessage state={state} />

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
      >
        <Icon name="payments" className="text-[18px]" />
        {pending ? "Saving…" : `Record payment of ${formatKes(amount)}`}
      </button>
    </ConfirmForm>
  );
}
