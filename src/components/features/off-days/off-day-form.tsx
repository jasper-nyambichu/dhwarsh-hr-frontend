"use client";

import { useActionState, useEffect, useRef } from "react";

import { grantOffDayAction, removeOffDayAction } from "@/app/actions/off-day";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage, SelectField, TextField } from "@/components/shared/form-field";
import { Icon } from "@/components/ui/icon";
import type { ActionState } from "@/types";

/** The agent gives one of their own employees one day or several days off. */
export function OffDayForm({ employees }: { employees: { id: number; name: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(grantOffDayAction, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <BentoCard title="Give an off day" subtitle="For one day, use the same date twice.">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <SelectField label="Employee" name="employeeId" required defaultValue="" error={errors?.employeeId?.[0]}>
          <option value="" disabled>Choose an employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>{employee.name}</option>
          ))}
        </SelectField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
          <TextField label="From" name="startDate" type="date" required error={errors?.startDate?.[0]} />
          <TextField label="To" name="endDate" type="date" required error={errors?.endDate?.[0]} />
        </div>
        <TextField label="Reason" name="reason" maxLength={255} placeholder="Optional" />
        <FormMessage state={state} successText="Off day saved." />
        <button
          type="submit"
          disabled={pending || employees.length === 0}
          className="min-h-11 rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Off Day"}
        </button>
      </form>
    </BentoCard>
  );
}

export function RemoveOffDayButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(removeOffDayAction, { status: "idle" });

  return (
    <form action={formAction} className="flex shrink-0 flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label="Remove this off day"
        title="Remove this off day"
        className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error/5 hover:text-error disabled:opacity-60"
      >
        <Icon name="delete" className="text-[18px]" />
      </button>
      {state.status === "error" ? <span role="alert" className="max-w-40 text-right text-[11px] text-error">{state.message}</span> : null}
    </form>
  );
}
