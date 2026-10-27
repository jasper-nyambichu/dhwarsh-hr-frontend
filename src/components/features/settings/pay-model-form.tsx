"use client";

import { useActionState, useId, useState } from "react";

import { savePaySettingsAction } from "@/app/actions/pay-settings";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage } from "@/components/shared/form-field";
import type { ActionState } from "@/types";
import type { ContributionMode, PaySettingsResponse } from "@/types/pay-model";

// 44px tall for easy tapping; 16px text on phones so iOS does not zoom the page when focusing.
const INPUT =
  "min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-base text-on-surface focus:outline-none focus:ring-1 focus:ring-primary md:text-sm";

function kes(amount: number): string {
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `KES ${formatted}`;
}

/** Mirrors the server: a percentage of pay, or a flat amount; nothing on a payslip with no pay. */
function contribution(pay: number, mode: ContributionMode, raw: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || pay <= 0) return 0;
  return mode === "FIXED" ? value : (pay * value) / 100;
}

function ModeToggle({
  name,
  label,
  mode,
  onChange,
}: {
  name: string;
  label: string;
  mode: ContributionMode;
  onChange: (mode: ContributionMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex self-start rounded-lg border border-outline-variant p-0.5"
    >
      {(["PERCENT", "FIXED"] as const).map((option) => (
        <label
          key={option}
          className={`flex min-h-10 cursor-pointer items-center rounded-md px-3 text-sm font-medium transition-colors focus-within:ring-1 focus-within:ring-primary ${
            mode === option
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={mode === option}
            onChange={() => onChange(option)}
            className="sr-only"
          />
          {option === "PERCENT" ? "% of pay" : "Fixed amount"}
        </label>
      ))}
    </div>
  );
}

function ContributionField({
  label,
  modeName,
  valueName,
  mode,
  value,
  onMode,
  onValue,
  error,
}: {
  label: string;
  modeName: string;
  valueName: string;
  mode: ContributionMode;
  value: string;
  onMode: (mode: ContributionMode) => void;
  onValue: (value: string) => void;
  error?: string;
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor={id} className="text-sm font-medium text-on-surface">
          {label}
        </label>
        <ModeToggle name={modeName} label={`${label} calculation`} mode={mode} onChange={onMode} />
      </div>
      <div className="relative">
        <input
          id={id}
          name={valueName}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          value={value}
          onChange={(event) => onValue(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${INPUT} pr-16 ${error ? "border-error" : ""}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-on-surface-variant">
          {mode === "PERCENT" ? "%" : "KES"}
        </span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SwitchRow({
  name,
  label,
  description,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/60 p-3 hover:bg-surface-container-low">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-primary"
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-on-surface">{label}</span>
        <span className="text-xs text-on-surface-variant">{description}</span>
      </span>
    </label>
  );
}

function PreviewRow({
  label,
  value,
  hint,
  strong = false,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${strong ? "border-t border-outline-variant/40 pt-3" : ""}`}>
      <div className="min-w-0">
        <dt className={`text-sm ${strong ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>{label}</dt>
        {hint ? <p className="text-xs text-outline">{hint}</p> : null}
      </div>
      <dd className={`shrink-0 tabular-nums ${strong ? "text-base font-bold text-on-surface" : "text-sm text-on-surface"}`}>
        {value}
      </dd>
    </div>
  );
}

/**
 * The Admin's pay settings: pay = days worked × the daily rate, with SHIF and NSSF added on top.
 * The example payslip beside the form recalculates as the Admin types, using the same arithmetic
 * as the payroll engine (the engine remains the authority; this is a preview).
 */
export function PayModelForm({ initial }: { initial: PaySettingsResponse }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(savePaySettingsAction, {
    status: "idle",
  });

  const [dailyRate, setDailyRate] = useState(String(initial.dailyRate));
  const [shifMode, setShifMode] = useState<ContributionMode>(initial.shifMode);
  const [shifValue, setShifValue] = useState(String(initial.shifValue));
  const [nssfMode, setNssfMode] = useState<ContributionMode>(initial.nssfMode);
  const [nssfValue, setNssfValue] = useState(String(initial.nssfValue));
  const [applyHousingLevy, setApplyHousingLevy] = useState(initial.applyHousingLevy);
  const [applyPaye, setApplyPaye] = useState(initial.applyPaye);
  const [applyNita, setApplyNita] = useState(initial.applyNita);
  const [ceiling, setCeiling] = useState(String(initial.deductionCeilingPercent));
  const [exampleDays, setExampleDays] = useState("30");

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const rate = Number(dailyRate);
  const days = Number(exampleDays);
  const pay = Number.isFinite(rate) && Number.isFinite(days) && rate > 0 && days > 0 ? rate * days : 0;
  const shif = contribution(pay, shifMode, shifValue);
  const nssf = contribution(pay, nssfMode, nssfValue);
  const total = pay + shif + nssf;
  const ceilingPercent = Number(ceiling);
  const ceilingAmount = Number.isFinite(ceilingPercent) ? (pay * ceilingPercent) / 100 : 0;

  const rateId = useId();
  const ceilingId = useId();
  const daysId = useId();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <form action={formAction} className="flex min-w-0 flex-col gap-4">
        <input type="hidden" name="vatRate" value={initial.vatRate} />

        <BentoCard title="Daily rate" subtitle="What one day worked pays. Pay for a period = days worked × this rate.">
          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor={rateId} className="text-sm font-medium text-on-surface">
              Daily rate
            </label>
            <div className="relative">
              <input
                id={rateId}
                name="dailyRate"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                value={dailyRate}
                onChange={(event) => setDailyRate(event.target.value)}
                aria-invalid={errors.dailyRate ? true : undefined}
                className={`${INPUT} pr-16 ${errors.dailyRate ? "border-error" : ""}`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-on-surface-variant">
                KES
              </span>
            </div>
            {errors.dailyRate?.[0] ? <p className="text-xs text-error">{errors.dailyRate[0]}</p> : null}
          </div>
        </BentoCard>

        <BentoCard
          title="SHIF and NSSF"
          subtitle="Added on top of the pay: total employee salary = pay + SHIF + NSSF. Each can be a percentage of pay or a fixed amount."
        >
          <div className="flex flex-col gap-6">
            <ContributionField
              label="SHIF"
              modeName="shifMode"
              valueName="shifValue"
              mode={shifMode}
              value={shifValue}
              onMode={setShifMode}
              onValue={setShifValue}
              error={errors.shifValue?.[0] ?? errors.shifMode?.[0]}
            />
            <ContributionField
              label="NSSF"
              modeName="nssfMode"
              valueName="nssfValue"
              mode={nssfMode}
              value={nssfValue}
              onMode={setNssfMode}
              onValue={setNssfValue}
              error={errors.nssfValue?.[0] ?? errors.nssfMode?.[0]}
            />
          </div>
        </BentoCard>

        <BentoCard
          title="Other statutory items"
          subtitle="The owner's formula leaves these out, so they are off. Check with your accountant before turning any on."
        >
          <div className="flex flex-col gap-3">
            <SwitchRow
              name="applyHousingLevy"
              label="Housing Levy"
              description="Taken from the employee's pay when on."
              checked={applyHousingLevy}
              onChange={setApplyHousingLevy}
            />
            <SwitchRow
              name="applyPaye"
              label="PAYE"
              description="Income tax, taken from the employee's pay when on."
              checked={applyPaye}
              onChange={setApplyPaye}
            />
            <SwitchRow
              name="applyNita"
              label="NITA"
              description="An employer levy: recorded for remittance, never taken from the employee."
              checked={applyNita}
              onChange={setApplyNita}
            />
          </div>
        </BentoCard>

        <BentoCard
          title="Deduction limit"
          subtitle="The most that loan instalments, damages and any tax or levy may take off one payslip, as a share of gross pay."
        >
          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor={ceilingId} className="text-sm font-medium text-on-surface">
              Maximum deductions per payslip
            </label>
            <div className="relative">
              <input
                id={ceilingId}
                name="deductionCeilingPercent"
                type="number"
                inputMode="decimal"
                min="1"
                max="100"
                step="0.01"
                required
                value={ceiling}
                onChange={(event) => setCeiling(event.target.value)}
                aria-invalid={errors.deductionCeilingPercent ? true : undefined}
                className={`${INPUT} pr-12 ${errors.deductionCeilingPercent ? "border-error" : ""}`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-on-surface-variant">
                %
              </span>
            </div>
            {errors.deductionCeilingPercent?.[0] ? (
              <p className="text-xs text-error">{errors.deductionCeilingPercent[0]}</p>
            ) : (
              <p className="text-xs text-on-surface-variant">
                Kenyan law limits wage deductions to two thirds of wages (66.67%). Loans are taken first, then damages;
                a damage that does not fit waits for the next run.
              </p>
            )}
          </div>
        </BentoCard>

        <div aria-live="polite">
          <FormMessage state={state} successText="Pay settings saved. New payroll runs will use them." />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
        >
          {pending ? "Saving…" : "Save pay settings"}
        </button>
      </form>

      <div className="min-w-0 lg:sticky lg:top-4">
        <BentoCard title="Example payslip" subtitle="Updates as you type. The payroll engine does the real calculation.">
          <div className="mb-3 flex items-center gap-3">
            <label htmlFor={daysId} className="text-sm text-on-surface-variant">
              Days worked
            </label>
            <input
              id={daysId}
              type="number"
              inputMode="numeric"
              min="0"
              max="31"
              step="1"
              value={exampleDays}
              onChange={(event) => setExampleDays(event.target.value)}
              className={`${INPUT} w-24`}
            />
          </div>

          <dl>
            <PreviewRow
              label={`${Number.isFinite(days) && days > 0 ? days : 0} days × ${kes(Number.isFinite(rate) && rate > 0 ? rate : 0)}`}
              value={kes(pay)}
              hint="Pay for the days worked — what the employee receives"
            />
            <PreviewRow
              label={`SHIF (${shifMode === "PERCENT" ? `${shifValue || 0}%` : "fixed"})`}
              value={`+ ${kes(shif)}`}
            />
            <PreviewRow
              label={`NSSF (${nssfMode === "PERCENT" ? `${nssfValue || 0}%` : "fixed"})`}
              value={`+ ${kes(nssf)}`}
            />
            <PreviewRow strong label="Total employee salary" value={kes(total)} hint="Pay + SHIF + NSSF — the figure agents are billed on" />
          </dl>

          <div className="mt-4 rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
            <p>
              Loans and damages together can take at most <strong className="text-on-surface">{kes(ceilingAmount)}</strong>{" "}
              from this payslip.
            </p>
            <p className="mt-1">
              Housing Levy {applyHousingLevy ? "on" : "off"} · PAYE {applyPaye ? "on" : "off"} · NITA{" "}
              {applyNita ? "on" : "off"}
            </p>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}