import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import { ActionFeedback } from "@/components/shared/action-feedback";
import { DateInput } from "@/components/shared/date-input";
import type { ActionState } from "@/types";

export const CONTROL =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-fixed disabled:cursor-not-allowed disabled:opacity-60";
export const LABEL = "mb-1 block font-table-header text-table-header uppercase text-outline";

type FieldMeta = { label: string; name: string; error?: string; hint?: string; className?: string };

export function TextField({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldMeta) {
  return (
    <div className={className}>
      <label className={LABEL} htmlFor={`field-${name}`}>
        {label}
        {props.required ? <span className="ml-0.5 text-error">*</span> : null}
      </label>
      {props.type === "date" ? (
        <DateInput
          id={`field-${name}`}
          name={name}
          className={CONTROL}
          defaultValue={typeof props.defaultValue === "string" ? props.defaultValue : undefined}
          min={typeof props.min === "string" ? props.min : undefined}
          max={typeof props.max === "string" ? props.max : undefined}
          required={props.required}
          disabled={props.disabled}
        />
      ) : (
        <input id={`field-${name}`} name={name} className={CONTROL} {...props} />
      )}
      {hint ? <p className="mt-1 text-[11px] text-outline">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & FieldMeta & { children: ReactNode }) {
  return (
    <div className={className}>
      <label className={LABEL} htmlFor={`field-${name}`}>
        {label}
        {props.required ? <span className="ml-0.5 text-error">*</span> : null}
      </label>
      <select id={`field-${name}`} name={name} className={CONTROL} {...props}>
        {children}
      </select>
      {hint ? <p className="mt-1 text-[11px] text-outline">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}

/**
 * Shows the result of the last submit as a toast. A server's error also stays beside the form, since the
 * toast leaves on its own and the user may still need to read it.
 */
export function FormMessage({
  state,
  successText = "Saved.",
}: {
  state: ActionState<unknown>;
  successText?: string;
}) {
  return (
    <>
      <ActionFeedback state={state} successText={successText} />
      {state.status === "error" ? (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/5 px-4 py-3 font-body-md text-body-md text-error">
          {state.message}
        </p>
      ) : null}
    </>
  );
}