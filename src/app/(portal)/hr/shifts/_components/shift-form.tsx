"use client";

import { useActionState } from "react";

import { createShiftAction } from "@/app/actions/shift";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useActionToast } from "@/hooks/use-action-toast";
import type { ActionState, ShiftResponse } from "@/types";

/**
 * New shift.
 *
 * The type select offers `ShiftType` values, not shift names: a shift called
 * "Day" has the type MORNING. Offering "Day / Night / Split" here would look
 * consistent with the seeded rows and be rejected by the Java enum on submit.
 */
export function ShiftForm() {
  const [state, formAction] = useActionState<ActionState<ShiftResponse>, FormData>(
    createShiftAction,
    { status: "idle" },
  );

  useActionToast(state, {
    success: (shift) => `Shift "${shift.name}" created`,
  });

  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" ? (
        <p role="alert" className="text-[11px] text-error">
          {state.message}
        </p>
      ) : null}

      <Field
        label="Name"
        name="name"
        placeholder="e.g. Day"
        required
        error={errors?.name?.[0]}
      />

      <div>
        <label
          htmlFor="shift-type"
          className="mb-1 block font-table-header text-table-header uppercase text-outline"
        >
          Type
        </label>
        <select
          id="shift-type"
          name="type"
          required
          defaultValue=""
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
        >
          <option value="" disabled>
            Select type
          </option>
          <option value="MORNING">Morning</option>
          <option value="EVENING">Evening</option>
          <option value="NIGHT">Night</option>
          <option value="ROTATING">Rotating</option>
          <option value="FLEXIBLE">Flexible</option>
        </select>
        {errors?.type?.[0] ? (
          <p className="mt-1 text-[11px] text-error">{errors.type[0]}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts" name="startTime" type="time" error={errors?.startTime?.[0]} />
        <Field label="Ends" name="endTime" type="time" error={errors?.endTime?.[0]} />
      </div>

      <Button type="submit" icon="add" className="w-fit">
        <Icon name="schedule" className="text-[18px]" />
        Create shift
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={`shift-${name}`}
        className="mb-1 block font-table-header text-table-header uppercase text-outline"
      >
        {label}
        {props.required ? <span className="ml-0.5 text-error">*</span> : null}
      </label>
      <input
        id={`shift-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
        {...props}
      />
      {error ? <p className="mt-1 text-[11px] text-error">{error}</p> : null}
    </div>
  );
}
