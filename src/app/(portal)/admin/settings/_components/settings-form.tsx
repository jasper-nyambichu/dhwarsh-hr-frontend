"use client";

import { useActionState } from "react";

import { saveSettingsAction } from "@/app/actions/company";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage, TextField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

type Values = {
  vatRate: number;
  defaultWorkingHoursPerDay: number;
  overtimeMultiplier: number;
  weekendDays: string;
};

/** Payroll rules. Super Admin edits; ADMIN sees them read-only. */
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
  const weekend = new Set(initial.weekendDays.split(",").map((day) => day.trim().toUpperCase()));

  return (
    <form action={formAction}>
      <BentoCard
        title="Payroll Rules"
        subtitle={saved ? "Payroll is calculated against these." : "Defaults shown — save to make them the live rules."}
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

          <div className="sm:col-span-3">
            <p className="mb-2 block font-table-header text-table-header uppercase text-outline">Weekend days</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <label key={day} className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface has-[:checked]:border-primary has-[:checked]:bg-primary-fixed">
                  <input type="checkbox" name="weekendDays" value={day} defaultChecked={weekend.has(day)} className="size-4 accent-primary" />
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-outline">Choose one or two. Excluded from working-day, unpaid-leave and overtime calculations.</p>
            {errors?.weekendDays?.[0] ? <p className="mt-1 text-xs text-error">{errors.weekendDays[0]}</p> : null}
          </div>

          <p className="text-xs text-on-surface-variant sm:col-span-3">
            Payroll period: <strong>Monthly</strong> — the only period the payroll engine supports.
          </p>
        </fieldset>

        {!readOnly ? (
          <div className="mt-5 flex flex-col gap-3">
            <FormMessage state={state} successText="Payroll rules saved." />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save Payroll Rules"}
              </button>
            </div>
          </div>
        ) : null}
      </BentoCard>
    </form>
  );
}