"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createBranchAction, updateBranchAction } from "@/app/actions/branch";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage, SelectField, TextField } from "@/components/shared/form-field";
import type { ActionState, BranchResponse } from "@/types";

/** Add or edit a branch. `managers` are active Branch Manager logins free to assign. */
export function BranchForm({
  mode,
  initial,
  managers,
}: {
  mode: "create" | "edit";
  initial?: BranchResponse;
  managers: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === "create" ? createBranchAction : updateBranchAction,
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-2xl flex-col gap-gutter">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <BentoCard title="Branch details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Branch name" name="name" required defaultValue={initial?.name} error={errors?.name?.[0]} placeholder="e.g. Nakuru" />
          <TextField
            label="Branch code"
            name="code"
            required
            defaultValue={initial?.code}
            error={errors?.code?.[0]}
            hint="Used in employee numbers, e.g. EMP-NKR-0001. Saved in capitals."
            placeholder="e.g. NKR"
          />
          <TextField label="Phone" name="phone" type="tel" defaultValue={initial?.phone ?? undefined} error={errors?.phone?.[0]} />
          <TextField label="Email" name="email" type="email" defaultValue={initial?.email ?? undefined} error={errors?.email?.[0]} />
          <TextField className="sm:col-span-2" label="Address" name="address" defaultValue={initial?.address ?? undefined} error={errors?.address?.[0]} />
          <SelectField
            className="sm:col-span-2"
            label="Branch manager"
            name="managerId"
            defaultValue={initial?.managerId ? String(initial.managerId) : ""}
            hint="Only Branch Manager accounts that don't already run another branch are listed. Assigning one gives that login access to this branch."
          >
            <option value="">Unassigned</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </SelectField>
        </div>
      </BentoCard>

      <FormMessage state={state} successText="Branch saved." />

      <div className="flex justify-end gap-3">
        <Link
          href="/admin/branches"
          className="rounded-lg border border-outline-variant px-5 py-2.5 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          Back
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Create Branch" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}