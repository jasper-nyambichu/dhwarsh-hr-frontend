"use client";

import { useActionState, useState } from "react";

import { assignRosterShiftAction } from "@/app/actions/roster";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage, SelectField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/** Put one employee, or the whole branch, on a shift. */
export function AssignShiftForm({
  shifts,
  employees,
}: {
  shifts: { id: number; label: string }[];
  employees: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(assignRosterShiftAction, {
    status: "idle",
  });
  const [target, setTarget] = useState<"branch" | "employee">("branch");
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <BentoCard title="Assign a shift">
      <ConfirmForm
        action={formAction}
        confirm={{
          title: "Assign this shift?",
          message: target === "branch" ? "Everyone in the branch will be put on this shift." : "This employee will be put on this shift.",
          confirmLabel: "Assign",
          icon: "schedule",
        }}
        className="flex flex-col gap-4"
      >
        <SelectField label="Shift" name="shiftId" required defaultValue="" error={errors?.shiftId?.[0]}>
          <option value="" disabled>Select a shift…</option>
          {shifts.map((shift) => (
            <option key={shift.id} value={shift.id}>{shift.label}</option>
          ))}
        </SelectField>

        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
            <input type="radio" name="target" value="branch" checked={target === "branch"} onChange={() => setTarget("branch")} className="size-4 accent-primary" />
            The whole branch
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
            <input type="radio" name="target" value="employee" checked={target === "employee"} onChange={() => setTarget("employee")} className="size-4 accent-primary" />
            One employee
          </label>
        </div>

        {target === "employee" ? (
          <SelectField label="Employee" name="employeeId" required defaultValue="" error={errors?.employeeId?.[0]}>
            <option value="" disabled>Select an employee…</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </SelectField>
        ) : null}

        <FormMessage state={state} successText="Shift assigned." />

        <button
          type="submit"
          disabled={pending || shifts.length === 0}
          className="rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Assigning…" : "Assign Shift"}
        </button>
        {shifts.length === 0 ? <p className="text-xs text-on-surface-variant">No shifts exist yet. An Admin defines them.</p> : null}
      </ConfirmForm>
    </BentoCard>
  );
}