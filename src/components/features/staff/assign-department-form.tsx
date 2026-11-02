"use client";

import { useActionState } from "react";

import { assignDepartmentAction } from "@/app/actions/staff";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage, SelectField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/** Put an employee in one of the company-wide departments. */
export function AssignDepartmentForm({
  employeeId,
  currentDepartmentId,
  departments,
}: {
  employeeId: number;
  currentDepartmentId: number | null;
  departments: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(assignDepartmentAction, {
    status: "idle",
  });
  const error = state.status === "error" ? state.fieldErrors?.departmentId?.[0] : undefined;

  return (
    <BentoCard title="Department">
      <ConfirmForm
        action={formAction}
        confirm={{ title: "Save this department?", message: "The employee will be assigned to the department you chose.", confirmLabel: "Save", icon: "account_tree" }}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="employeeId" value={employeeId} />
        <SelectField
          label="Assign to"
          name="departmentId"
          required
          defaultValue={currentDepartmentId ? String(currentDepartmentId) : ""}
          error={error}
        >
          <option value="" disabled>Select a department…</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </SelectField>
        <FormMessage state={state} successText="Department updated." />
        <button
          type="submit"
          disabled={pending || departments.length === 0}
          className="rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Department"}
        </button>
        {departments.length === 0 ? (
          <p className="text-xs text-on-surface-variant">No departments exist yet. An Admin creates them under Departments.</p>
        ) : null}
      </ConfirmForm>
    </BentoCard>
  );
}