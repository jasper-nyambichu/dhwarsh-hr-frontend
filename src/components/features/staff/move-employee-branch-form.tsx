"use client";

import { useActionState } from "react";

import { moveStaffBranchAction } from "@/app/actions/staff";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage, SelectField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/** Admin: move an employee to another branch. A terminal only accepts its own branch's staff. */
export function MoveEmployeeBranchForm({
  employeeId,
  currentBranchId,
  branches,
}: {
  employeeId: number;
  currentBranchId: number;
  branches: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(moveStaffBranchAction, { status: "idle" });

  return (
    <BentoCard title="Branch" subtitle="After moving, enrol them on a terminal at the new branch so they can clock in.">
      <ConfirmForm
        action={formAction}
        confirm={{ title: "Move this employee?", message: "After moving, enrol them on a terminal at the new branch so they can clock in.", confirmLabel: "Move", icon: "move_up" }}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="employeeId" value={employeeId} />
        <SelectField label="Works at" name="branchId" required defaultValue={String(currentBranchId)}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </SelectField>
        <FormMessage state={state} successText="Branch changed." />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Move Employee"}
        </button>
      </ConfirmForm>
    </BentoCard>
  );
}
