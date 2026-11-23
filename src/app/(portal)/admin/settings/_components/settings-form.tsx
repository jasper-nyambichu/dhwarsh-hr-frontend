"use client";

import { useActionState } from "react";

import { saveSettingsAction } from "@/app/actions/company";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage, TextField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

type Values = {
  vatRate: number;
  defaultWorkingHoursPerDay: number;
  overtimeMultiplier: number;
};

/** Company rules. Admin edits. */
export function SettingsForm({
  initial,
  saved,
  readOnly,
}: {
  initial: Values;
  /** False when the row doesn't exist yet and these are just the defaults. */
  saved: boolean;
  readOnly: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveSettingsAction, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <ConfirmForm
      action={formAction}
      confirm={{ title: "Save the company rules?", message: "Agent payments will use the VAT rate saved here.", confirmLabel: "Save", icon: "save" }}
    >
      <BentoCard
        title="Company Rules"
        subtitle={saved ? "Agent payments use the VAT rate saved here." : "Defaults shown — save to make them the live rules."}
      >
        <fieldset disabled={readOnly || pending} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            label="VAT rate (%)"
            name="vatRate"
            type="number"
            min={0}
            max={100}
            step="0.01"
            required
            defaultValue={initial.vatRate}
            error={errors?.vatRate?.[0]}
            hint="Charged on invoices of VAT-registered agents."
          />
          <TextField
            label="Working hours / day"
            name="defaultWorkingHoursPerDay"
            type="number"
            min={1}
            max={24}
            step="0.25"
            required
            defaultValue={initial.defaultWorkingHoursPerDay}
            error={errors?.defaultWorkingHoursPerDay?.[0]}
          />
          <TextField
            label="Overtime multiplier"
            name="overtimeMultiplier"
            type="number"
            min={1}
            max={5}
            step="0.05"
            required
            defaultValue={initial.overtimeMultiplier}
            error={errors?.overtimeMultiplier?.[0]}
          />

          <p className="text-xs text-on-surface-variant sm:col-span-3">
            Work days and hours are set below, under <strong>Work week</strong>.
          </p>

          <p className="text-xs text-on-surface-variant sm:col-span-3">
            Payroll period: <strong>Monthly</strong> — the only period the payroll engine supports.
          </p>
        </fieldset>

        {!readOnly ? (
          <div className="mt-5 flex flex-col gap-3">
            <FormMessage state={state} successText="Company rules saved." />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save Company Rules"}
              </button>
            </div>
          </div>
        ) : null}
      </BentoCard>
    </ConfirmForm>
  );
}