"use client";

import { useActionState } from "react";

import { calculateAgentPaymentsAction } from "@/app/actions/pay-settings";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage, TextField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/**
 * Starts the calculation for a period. It moves real balances (loans, damages, advances) and a period
 * can only be paid once, so it asks first.
 */
export function AgentPaymentForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(calculateAgentPaymentsAction, {
    status: "idle",
  });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <BentoCard
      title="Calculate agent payments"
      subtitle="Uses the days the Back Office locked for exactly this period. Each agent's amount then waits under Money Requests for you to release."
    >
      <ConfirmForm
        action={formAction}
        confirm={{
          title: "Calculate agent payments?",
          message: "Loans, damages and advances will be deducted, and this period cannot be paid again.",
          confirmLabel: "Calculate",
          icon: "calculate",
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Period start" name="periodStart" type="date" required error={errors.periodStart?.[0]} />
          <TextField label="Period end" name="periodEnd" type="date" required error={errors.periodEnd?.[0]} />
        </div>

        <div aria-live="polite">
          <FormMessage state={state} successText="Agent payments calculated. Release them under Money Requests." />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
        >
          {pending ? "Calculating…" : "Calculate payments"}
        </button>
      </ConfirmForm>
    </BentoCard>
  );
}
