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

/** Fixed by law and by `StatutoryDeductionCalculator` on the server. */
const NITA_PER_EMPLOYEE = 50;
const PAYE_BANDS: readonly (readonly [number, number])[] = [
  [24000, 0.1],
  [8333, 0.25],
  [467667, 0.3],
  [300000, 0.325],
  [Number.POSITIVE_INFINITY, 0.35],
];
const PERSONAL_RELIEF = 2400;

function kes(amount: number): string {
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `KES ${formatted}`;
}

function amount(raw: string): number {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Mirrors the server: a percentage of pay, or a flat amount; nothing when there is no pay. */
function contribution(pay: number, mode: ContributionMode, raw: string): number {
  if (pay <= 0) return 0;
  const value = amount(raw);
  return mode === "FIXED" ? value : (pay * value) / 100;
}

/** Mirrors the server: progressive bands on pay after NSSF, less personal relief. */
function paye(pay: number, nssf: number): number {
  let remaining = Math.max(pay - nssf, 0);
  let tax = 0;
  for (const [width, rate] of PAYE_BANDS) {
    const slice = Math.min(remaining, width);
    tax += slice * rate;
    remaining -= slice;
  }
  return Math.max(tax - PERSONAL_RELIEF, 0);
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

function SuffixInput({
  id,
  name,
  value,
  onChange,
  suffix,
  min,
  max,
  error,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  min: string;
  max?: string;
  error?: string;
}) {
  return (
    <>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step="0.01"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${INPUT} pr-16 ${error ? "border-error" : ""}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-on-surface-variant">
          {suffix}
        </span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </>
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

function ExampleInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs text-on-surface-variant">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT}
      />
    </div>
  );
}

/**
 * The Admin's pay rates. An agent is paid:
 * (days worked × daily rate) + PAYE + NSSF + NITA + VAT + agent fee − loans − damages − advances.
 * The example beside the form recalculates as the Admin types, using the same arithmetic as
 * `AgentSettlementCalculator` (the server remains the authority; this is a preview).
 */
export function PayModelForm({ initial }: { initial: PaySettingsResponse }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(savePaySettingsAction, {
    status: "idle",
  });

  const [dailyRate, setDailyRate] = useState(String(initial.dailyRate));
  const [nssfMode, setNssfMode] = useState<ContributionMode>(initial.nssfMode);
  const [nssfValue, setNssfValue] = useState(String(initial.nssfValue));
  const [vatRate, setVatRate] = useState(String(initial.vatRate));
  const [ceiling, setCeiling] = useState(String(initial.deductionCeilingPercent));

  const [exampleDays, setExampleDays] = useState("30");
  const [exampleFee, setExampleFee] = useState("500");
  const [exampleLoans, setExampleLoans] = useState("0");
  const [exampleDamages, setExampleDamages] = useState("0");
  const [exampleAdvance, setExampleAdvance] = useState("0");

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const days = amount(exampleDays);
  const rate = amount(dailyRate);
  const pay = rate * days;
  const nssf = contribution(pay, nssfMode, nssfValue);
  const tax = paye(pay, nssf);
  const nita = days > 0 ? NITA_PER_EMPLOYEE : 0;
  const fee = amount(exampleFee);
  const subtotal = pay + tax + nssf + nita + fee;
  const vat = (subtotal * amount(vatRate)) / 100;
  const beforeAdvance = Math.max(subtotal + vat - amount(exampleLoans) - amount(exampleDamages), 0);
  const advance = Math.min(amount(exampleAdvance), beforeAdvance);
  const payable = beforeAdvance - advance;

  const rateId = useId();
  const nssfId = useId();
  const vatId = useId();
  const ceilingId = useId();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <form action={formAction} className="flex min-w-0 flex-col gap-4">
        <BentoCard title="Daily rate" subtitle="What one day worked pays. Pay = days worked × this rate.">
          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor={rateId} className="text-sm font-medium text-on-surface">
              Daily rate
            </label>
            <SuffixInput
              id={rateId}
              name="dailyRate"
              value={dailyRate}
              onChange={setDailyRate}
              suffix="KES"
              min="0.01"
              error={errors.dailyRate?.[0]}
            />
          </div>
        </BentoCard>

        <BentoCard title="NSSF" subtitle="Added for each employee, as a percentage of their pay or a fixed amount.">
          <div className="flex max-w-sm flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor={nssfId} className="text-sm font-medium text-on-surface">
                NSSF
              </label>
              <ModeToggle name="nssfMode" label="NSSF calculation" mode={nssfMode} onChange={setNssfMode} />
            </div>
            <SuffixInput
              id={nssfId}
              name="nssfValue"
              value={nssfValue}
              onChange={setNssfValue}
              suffix={nssfMode === "PERCENT" ? "%" : "KES"}
              min="0"
              error={errors.nssfValue?.[0] ?? errors.nssfMode?.[0]}
            />
          </div>
        </BentoCard>

        <BentoCard title="VAT" subtitle="Charged on every agent's pay, PAYE, NSSF, NITA and agent fee, before loans, damages and advances come off.">
          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor={vatId} className="text-sm font-medium text-on-surface">
              VAT rate
            </label>
            <SuffixInput
              id={vatId}
              name="vatRate"
              value={vatRate}
              onChange={setVatRate}
              suffix="%"
              min="0"
              max="100"
              error={errors.vatRate?.[0]}
            />
          </div>
        </BentoCard>

        <BentoCard
          title="Deduction limit"
          subtitle="The most that loans and damages may take from one employee's pay, as a share of that pay."
        >
          <div className="flex max-w-sm flex-col gap-2">
            <label htmlFor={ceilingId} className="text-sm font-medium text-on-surface">
              Maximum deductions per employee
            </label>
            <SuffixInput
              id={ceilingId}
              name="deductionCeilingPercent"
              value={ceiling}
              onChange={setCeiling}
              suffix="%"
              min="1"
              max="100"
              error={errors.deductionCeilingPercent?.[0]}
            />
            {errors.deductionCeilingPercent?.[0] ? null : (
              <p className="text-xs text-on-surface-variant">
                Kenyan law limits wage deductions to two thirds of wages (66.67%). Loans are taken first, then damages;
                a damage that does not fit waits for the next period.
              </p>
            )}
          </div>
        </BentoCard>

        <div aria-live="polite">
          <FormMessage state={state} successText="Pay rates saved. New agent payments will use them." />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
        >
          {pending ? "Saving…" : "Save pay rates"}
        </button>
      </form>

      <div className="min-w-0 lg:sticky lg:top-4">
        <BentoCard title="Payment formula" subtitle="An example for one employee. It updates as you type; the server does the real calculation.">
          <p className="mb-4 rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
            (Days worked × daily rate) + PAYE + NSSF + NITA + VAT + agent fee − loans − damages − advances
          </p>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <ExampleInput label="Days worked" value={exampleDays} onChange={setExampleDays} />
            <ExampleInput label="Agent fee" value={exampleFee} onChange={setExampleFee} />
            <ExampleInput label="Loans" value={exampleLoans} onChange={setExampleLoans} />
            <ExampleInput label="Damages" value={exampleDamages} onChange={setExampleDamages} />
            <ExampleInput label="Advance" value={exampleAdvance} onChange={setExampleAdvance} />
          </div>

          <dl>
            <PreviewRow label={`${days} days × ${kes(rate)}`} value={kes(pay)} />
            <PreviewRow label="PAYE" value={`+ ${kes(tax)}`} />
            <PreviewRow label={`NSSF (${nssfMode === "PERCENT" ? `${nssfValue || 0}%` : "fixed"})`} value={`+ ${kes(nssf)}`} />
            <PreviewRow label="NITA" value={`+ ${kes(nita)}`} />
            <PreviewRow label="Agent fee" value={`+ ${kes(fee)}`} />
            <PreviewRow label={`VAT (${vatRate || 0}%)`} value={`+ ${kes(vat)}`} />
            <PreviewRow label="Loans" value={`− ${kes(amount(exampleLoans))}`} />
            <PreviewRow label="Damages" value={`− ${kes(amount(exampleDamages))}`} />
            <PreviewRow label="Advance" value={`− ${kes(advance)}`} hint="Anything that does not fit carries to the next payment" />
            <PreviewRow strong label="Paid to the agent" value={kes(payable)} />
          </dl>
        </BentoCard>
      </div>
    </div>
  );
}
