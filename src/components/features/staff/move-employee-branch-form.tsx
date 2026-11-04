"use client";

import { useActionState, useState } from "react";

import { moveStaffBranchAction } from "@/app/actions/staff";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage, SelectField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/**
 * Admin: move an employee to another branch. A saved fingerprint follows them, so they clock in at the new
 * branch without enrolling again. The backend refuses while they are clocked in, and that reason shows here.
 */
export function MoveEmployeeBranchForm({
  employeeId,
  employeeName,
  fingerprintSaved,
  currentBranchId,
  branches,
}: {
  employeeId: number;
  employeeName: string;
  fingerprintSaved: boolean;
  currentBranchId: number;
  branches: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(moveStaffBranchAction, { status: "idle" });
  const [selected, setSelected] = useState(String(currentBranchId));
  const nameOf = (id: string) => branches.find((branch) => String(branch.id) === id)?.name ?? "the new branch";
  const from = nameOf(String(currentBranchId));
  const to = nameOf(selected);

  return (
    <BentoCard
      title="Branch"
      subtitle={`Past attendance stays with the old branch. ${
        fingerprintSaved
          ? "Their fingerprint is saved, so they clock in at the new branch without enrolling again."
          : "Their fingerprint is not saved centrally yet, so the new branch's reader will not recognise them until it is."
      }`}
    >
      <ConfirmForm
        action={formAction}
        confirm={{
          title: "Move this employee?",
          message: `From ${from} to ${to}. They will clock in at ${to} from now on, and ${from}'s readers will stop accepting them.${
            fingerprintSaved ? "" : ` Their fingerprint is not saved centrally yet, so ${to}'s reader will not recognise them until it is.`
          }`,
          subject: employeeName,
          confirmLabel: "Move",
          icon: "move_up",
        }}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="employeeId" value={employeeId} />
        <SelectField label="Works at" name="branchId" required value={selected} onChange={(event) => setSelected(event.target.value)}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </SelectField>
        <FormMessage state={state} successText={`Moved to ${to}.`} />
        <button
          type="submit"
          disabled={pending || selected === String(currentBranchId)}
          className="min-h-11 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Move Employee"}
        </button>
      </ConfirmForm>
    </BentoCard>
  );
}
