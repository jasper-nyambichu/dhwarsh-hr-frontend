"use client";

import { useActionState, useState } from "react";

import { moveBranchManagerAction } from "@/app/actions/user";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage, SelectField } from "@/components/shared/form-field";
import type { ActionState } from "@/types";

/**
 * Moves a Branch Manager to another branch. A branch has one Branch Manager, so choosing a branch that has
 * one swaps the two, and the pop-up says so. On success the action opens the new branch's page, where the toast shows.
 */
export function MoveBranchManagerForm({
  userId,
  username,
  currentBranch,
  branches,
}: {
  userId: number;
  username: string;
  currentBranch: string;
  /** Every other active branch. */
  branches: { id: number; name: string; manager: string | null }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(moveBranchManagerAction, { status: "idle" });
  const [selected, setSelected] = useState("");
  const target = branches.find((branch) => String(branch.id) === selected);

  return (
    <div className="mt-4 border-t border-outline-variant/40 pt-4">
      <p className="text-sm font-semibold text-on-surface">Move to another branch</p>
      <p className="mt-0.5 text-xs text-on-surface-variant">Their username and password stay the same. {currentBranch} closes to them straight away.</p>

      {branches.length === 0 ? (
        <p className="mt-3 text-sm text-on-surface-variant">There is no other active branch to move them to.</p>
      ) : (
        <ConfirmForm
          action={formAction}
          confirm={{
            title: "Move this Branch Manager?",
            message: target?.manager
              ? `${target.name} already has ${target.manager} as its Branch Manager, so the two will swap: ${target.manager} goes to ${currentBranch}. Each will only see their new branch from then on.`
              : `They will stop seeing ${currentBranch} straight away and will only see ${target?.name ?? "the new branch"} from then on.`,
            subject: username,
            confirmLabel: target?.manager ? "Swap" : "Move",
            icon: "move_up",
          }}
          className="mt-3 flex flex-col gap-3"
        >
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="branchName" value={target?.name ?? ""} />
          <input type="hidden" name="swap" value={target?.manager ? "1" : ""} />
          <SelectField
            label="New branch"
            name={`branchId-${userId}`}
            required
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value="">Choose a branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.manager ? `${branch.name} (swap with ${branch.manager})` : branch.name}
              </option>
            ))}
          </SelectField>
          <FormMessage state={state} />
          <button
            type="submit"
            disabled={pending || !target}
            className="min-h-11 rounded-lg border border-primary px-6 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
          >
            {pending ? "Moving…" : target?.manager ? "Swap Branch Managers" : "Move Branch Manager"}
          </button>
        </ConfirmForm>
      )}
    </div>
  );
}
