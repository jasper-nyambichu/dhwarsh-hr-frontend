"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createDepartmentAction, updateDepartmentAction } from "@/app/actions/department";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage, SelectField, TextField } from "@/components/shared/form-field";
import type { ActionState, DepartmentResponse } from "@/types";

type Person = { id: number; name: string };

/**
 * Add or edit a department. The head must work in the department's branch, so the
 * head list follows the chosen branch and is cleared when the branch changes.
 */
export function DepartmentForm({
  mode,
  initial,
  branches,
  headsByBranch,
}: {
  mode: "create" | "edit";
  initial?: DepartmentResponse;
  branches: { id: number; name: string }[];
  headsByBranch: Record<number, Person[]>;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === "create" ? createDepartmentAction : updateDepartmentAction,
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  const [branchId, setBranchId] = useState(initial ? String(initial.branchId) : "");
  const [headId, setHeadId] = useState(initial?.headOfDepartmentId ? String(initial.headOfDepartmentId) : "");
  const heads = headsByBranch[Number(branchId)] ?? [];

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-2xl flex-col gap-gutter">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <BentoCard title="Department details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField className="sm:col-span-2" label="Department name" name="name" required defaultValue={initial?.name} error={errors?.name?.[0]} placeholder="e.g. Finance" />

          <SelectField
            label="Branch"
            name="branchId"
            required
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              // A head from the previous branch would be rejected.
              setHeadId("");
            }}
            error={errors?.branchId?.[0]}
          >
            <option value="" disabled>Select a branch…</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </SelectField>

          <SelectField
            label="Head of department"
            name="headOfDepartmentId"
            disabled={!branchId}
            value={headId}
            onChange={(event) => setHeadId(event.target.value)}
            error={errors?.headOfDepartmentId?.[0]}
            hint="Optional. Pick the branch first; only its active employees are listed."
          >
            <option value="">{!branchId ? "Select a branch first" : heads.length === 0 ? "No employees in this branch" : "None"}</option>
            {heads.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </SelectField>
        </div>
      </BentoCard>

      <FormMessage state={state} successText="Department saved." />

      <div className="flex justify-end gap-3">
        <Link
          href="/admin/departments"
          className="rounded-lg border border-outline-variant px-5 py-2.5 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          Back
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : mode === "create" ? "Create Department" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}